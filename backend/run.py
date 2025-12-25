"""
Flask Application Entry Point
"""
import os
from app import create_app, db

app = create_app(os.getenv('FLASK_ENV') or 'development')


@app.cli.command('init-db')
def init_db():
    """Initialize the database with sample data"""
    from app.models import User, Company, Job, BlogPost
    from app.utils.seed_data import seed_database
    
    db.create_all()
    seed_database(db)
    print('Database initialized with sample data!')


@app.cli.command('reset-db')
def reset_db():
    """Reset the database"""
    db.drop_all()
    db.create_all()
    print('Database reset!')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
