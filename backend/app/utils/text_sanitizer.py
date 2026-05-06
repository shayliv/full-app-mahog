"""
HTML sanitization utility for rich text content.
Prevents XSS attacks while preserving safe formatting.
"""
import bleach
from typing import Optional


# Allowed HTML tags for rich text content
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li', 'div', 'span'
]

# Allowed HTML attributes
ALLOWED_ATTRIBUTES = {
    '*': ['dir'],  # Allow dir attribute for RTL support
}

# Allowed CSS styles (empty for now, can be extended if needed)
ALLOWED_STYLES = []


def sanitize_html(html_content: Optional[str]) -> Optional[str]:
    """
    Sanitize HTML content to prevent XSS attacks.

    Args:
        html_content: Raw HTML string from user input

    Returns:
        Sanitized HTML string with only allowed tags and attributes
    """
    if not html_content:
        return html_content

    # Clean the HTML, stripping disallowed tags and attributes
    cleaned = bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        styles=ALLOWED_STYLES,
        strip=True
    )

    return cleaned


def strip_html(html_content: Optional[str]) -> Optional[str]:
    """
    Remove all HTML tags and return plain text.

    Args:
        html_content: HTML string

    Returns:
        Plain text with all HTML tags removed
    """
    if not html_content:
        return html_content

    return bleach.clean(html_content, tags=[], strip=True)
