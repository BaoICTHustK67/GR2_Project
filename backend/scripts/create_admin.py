import sys
import os

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User

def create_admin(email, name, password):
    app = create_app()
    with app.app_context():
        # Check if user already exists
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User {email} already exists. Updating role to admin.")
            user.user_role = 'admin'
            user.status = 'active'
        else:
            print(f"Creating new admin user: {email}")
            user = User(
                email=email,
                name=name,
                user_role='admin',
                status='active'
            )
        
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f"Admin user {email} created/updated successfully.")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Create an admin user.')
    parser.add_argument('--email', required=True, help='Email of the admin user')
    parser.add_argument('--name', required=True, help='Name of the admin user')
    parser.add_argument('--password', required=True, help='Password for the admin user')
    
    args = parser.parse_args()
    create_admin(args.email, args.name, args.password)
