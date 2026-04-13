from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User, UserRole
from app.models.department import Department
from app.schemas.commanders import CommanderListItem


router = APIRouter()


@router.get("/", response_model=list[CommanderListItem])
def list_commanders(db: Session = Depends(get_db)) -> list[CommanderListItem]:
    """Return all users who can be commanders (COMMANDER or DEPARTMENT_MANAGER role)."""
    rows = (
        db.query(User.id, User.full_name, User.department_id, Department.name)
        .outerjoin(Department, User.department_id == Department.id)
        .filter(User.role.in_([UserRole.COMMANDER, UserRole.DEPARTMENT_MANAGER]))
        .order_by(User.full_name)
        .all()
    )
    return [
        CommanderListItem(
            id=r.id,
            full_name=r.full_name,
            department_id=r.department_id,
            department_name=r.name,
        )
        for r in rows
    ]


@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_commanders_from_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Import commanders from an Excel or CSV file.
    Expected columns: full_name, role, department_name
    Optional columns: superior_name
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided.",
        )

    is_csv = file.filename.endswith('.csv')
    is_excel = file.filename.endswith('.xlsx') or file.filename.endswith('.xls')

    if not (is_csv or is_excel):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.",
        )

    try:
        from io import BytesIO, StringIO
        import csv

        contents = await file.read()

        # Parse file based on type
        if is_csv:
            text_content = contents.decode('utf-8-sig')
            csv_reader = csv.DictReader(StringIO(text_content))
            headers = csv_reader.fieldnames
            rows_data = list(csv_reader)
        else:
            import openpyxl
            workbook = openpyxl.load_workbook(BytesIO(contents))
            sheet = workbook.active
            headers = [cell.value for cell in sheet[1]]
            rows_data = [dict(zip(headers, row)) for row in sheet.iter_rows(min_row=2, values_only=True)]

        # Column mapping for Hebrew and English headers
        def get_column_value(row, *possible_names):
            """Get value from row using multiple possible column names."""
            for name in possible_names:
                if name in row and row[name] is not None:
                    return row[name]
            return None

        # Check if we have the minimum required fields
        has_name = any(h in headers for h in ['full_name', 'שם פרטי', 'שם משפחה'])

        if not has_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required columns. Need: name fields (full_name or שם פרטי+שם משפחה)",
            )

        imported_count = 0
        errors = []
        seen_names = set()  # Track names in current import to detect duplicates within file

        for row_idx, row_data in enumerate(rows_data, start=2):
            try:
                # Get full name - either from full_name column or combine first+last
                full_name = get_column_value(row_data, 'full_name')
                if not full_name:
                    first_name = get_column_value(row_data, 'שם פרטי', 'first_name')
                    last_name = get_column_value(row_data, 'שם משפחה', 'last_name')
                    if first_name and last_name:
                        full_name = f"{str(first_name).strip()} {str(last_name).strip()}"
                    elif first_name:
                        full_name = str(first_name).strip()
                    elif last_name:
                        full_name = str(last_name).strip()

                # Skip empty rows
                if not full_name:
                    continue

                full_name = full_name.strip()

                # Check for duplicates within the import file
                if full_name in seen_names:
                    errors.append(f"Row {row_idx}: Duplicate name '{full_name}' in import file")
                    continue

                seen_names.add(full_name)

                # Get role (optional - defaults to 'commander')
                role_str = get_column_value(row_data, 'role', 'תפקיד')
                if role_str:
                    role_str = str(role_str).strip().lower()
                    # Validate role
                    if role_str in ['commander', 'מפקד']:
                        role = UserRole.COMMANDER
                    elif role_str in ['department_manager', 'רמ"ג', 'רמג']:
                        role = UserRole.DEPARTMENT_MANAGER
                    elif role_str in ['admin', 'מנהל']:
                        role = UserRole.ADMIN
                    else:
                        errors.append(f"Row {row_idx}: Invalid role '{role_str}'. Must be 'commander', 'department_manager', or 'admin'")
                        continue
                else:
                    # Default to commander if no role specified
                    role = UserRole.COMMANDER

                # Check if user already exists in database
                existing = db.query(User).filter(User.full_name == full_name).first()
                if existing:
                    errors.append(f"Row {row_idx}: Commander '{full_name}' already exists")
                    continue

                # Find department by name if provided
                department_id = None
                dept_name = get_column_value(row_data, 'department_name', 'מרפאה', 'מגמה')
                if dept_name:
                    dept_name = str(dept_name).strip()
                    department = db.query(Department).filter(Department.name == dept_name).first()
                    if department:
                        department_id = department.id
                    else:
                        errors.append(f"Row {row_idx}: Department '{dept_name}' not found")
                        continue

                # Find superior by name if provided
                superior_id = None
                superior_name = get_column_value(row_data, 'superior_name', 'מפקד עליון')
                if superior_name:
                    superior_name = str(superior_name).strip()
                    superior = db.query(User).filter(User.full_name == superior_name).first()
                    if superior:
                        superior_id = superior.id
                    else:
                        errors.append(f"Row {row_idx}: Superior '{superior_name}' not found")
                        continue

                # Create user
                user = User(
                    full_name=full_name,
                    role=role,
                    department_id=department_id,
                    superior_id=superior_id,
                )
                db.add(user)
                imported_count += 1

            except Exception as e:
                errors.append(f"Row {row_idx}: {str(e)}")
                continue

        db.commit()

        return {
            "message": f"Successfully imported {imported_count} commanders",
            "imported_count": imported_count,
            "errors": errors if errors else None
        }

    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Required library not installed: {str(e)}",
        )
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file encoding error. Please ensure the file is UTF-8 encoded.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}",
        )
