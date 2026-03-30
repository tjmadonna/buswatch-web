import os
import sqlite3


def get_connection(path: str) -> sqlite3.Connection:
    """Get a connection to the SQLite database at the specified path.

    Args:
        path (str): The file path to the SQLite database.

    Returns:
        sqlite3.Connection: A connection object to the SQLite database.
    """
    exists = os.path.exists(path)
    conn = sqlite3.connect(path)
    if not exists:
        # get absolute path to this script
        path = os.path.dirname(os.path.abspath(__file__))
        sql_path = os.path.join(path, "00001_create_tables.sql")
        try:
            cursor = conn.cursor()
            # read the SQL file and execute it
            with open(sql_path, "r") as sql_file:
                sql_script = sql_file.read()
            cursor.executescript(sql_script)
        finally:
            cursor.close()

    return conn
