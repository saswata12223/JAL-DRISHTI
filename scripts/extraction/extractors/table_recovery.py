import os
import camelot
import pdfplumber
import pandas as pd
from pathlib import Path

def extract_tables(pdf_path, page_num):
    """
    Extract tables from a specific PDF page using Camelot (lattice & stream) and pdfplumber.
    Returns a list of DataFrames or dicts.
    """
    extracted_tables = []
    
    # Try Camelot Lattice
    try:
        tables_lattice = camelot.read_pdf(str(pdf_path), pages=str(page_num), flavor='lattice')
        for i, t in enumerate(tables_lattice):
            df = t.df
            if validate_table(df):
                extracted_tables.append({
                    'method': 'camelot_lattice',
                    'df': df,
                    'confidence': t.accuracy
                })
    except Exception:
        pass
        
    # Try Camelot Stream
    try:
        tables_stream = camelot.read_pdf(str(pdf_path), pages=str(page_num), flavor='stream')
        for i, t in enumerate(tables_stream):
            df = t.df
            if validate_table(df):
                extracted_tables.append({
                    'method': 'camelot_stream',
                    'df': df,
                    'confidence': t.accuracy
                })
    except Exception:
        pass

    # Try pdfplumber
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            page = pdf.pages[page_num - 1]
            tables_plumber = page.extract_tables()
            for t in tables_plumber:
                df = pd.DataFrame(t[1:], columns=t[0]) if len(t) > 1 else pd.DataFrame(t)
                if validate_table(df):
                    extracted_tables.append({
                        'method': 'pdfplumber',
                        'df': df,
                        'confidence': 80.0 # Placeholder confidence for plumber
                    })
    except Exception:
        pass
        
    return extracted_tables

def validate_table(df):
    """
    Check if a DataFrame looks like a valid table.
    """
    if df.empty:
        return False
        
    rows, cols = df.shape
    if rows < 2 or cols < 2:
        return False
        
    # Check empty cell ratio
    empty_cells = df.isna().sum().sum() + (df == "").sum().sum()
    empty_ratio = empty_cells / (rows * cols)
    
    if empty_ratio > 0.8: # If 80% empty, probably not a good table
        return False
        
    return True
