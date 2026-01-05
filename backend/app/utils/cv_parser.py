import os
import pypdf
import docx
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_stream):
    """Extract text from a PDF file stream."""
    try:
        reader = pypdf.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return None

def extract_text_from_docx(file_stream):
    """Extract text from a DOCX file stream."""
    try:
        doc = docx.Document(file_stream)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
        return None

def extract_text_from_txt(file_stream):
    """Extract text from a TXT file stream."""
    try:
        return file_stream.read().decode('utf-8').strip()
    except Exception as e:
        print(f"Error parsing TXT: {e}")
        return None

def extract_cv_data(file):
    """
    Orchestrates the extraction of text from a CV file.
    Returns the extracted text or None if failed.
    """
    if not file or not allowed_file(file.filename):
        return None

    filename = secure_filename(file.filename)
    extension = filename.rsplit('.', 1)[1].lower()

    try:
        if extension == 'pdf':
            return extract_text_from_pdf(file.stream)
        elif extension == 'docx':
            return extract_text_from_docx(file.stream)
        elif extension == 'txt':
            return extract_text_from_txt(file.stream)
        else:
            return None
    except Exception as e:
        print(f"Error extracting CV data: {e}")
        return None
