"""
Database Seed Data
"""
from app.models import User, Company, Job, BlogPost, Comment


def seed_database(db):
    """Seed the database with sample data"""
    
    # Create sample companies
    companies_data = [
        {
            'name': 'TechCorp Vietnam',
            'description': 'Leading technology company in Vietnam specializing in software development and digital transformation.',
            'logo': 'https://ui-avatars.com/api/?name=TechCorp&background=bf3131&color=fff',
            'website': 'https://techcorp.vn',
            'industry': 'Technology',
            'size': '201-500',
            'location': 'Ho Chi Minh City, Vietnam',
            'founded': 2015
        },
        {
            'name': 'DataStream Solutions',
            'description': 'Big data and analytics company providing enterprise solutions.',
            'logo': 'https://ui-avatars.com/api/?name=DataStream&background=7d0a0a&color=fff',
            'website': 'https://datastream.io',
            'industry': 'Data Analytics',
            'size': '51-200',
            'location': 'Hanoi, Vietnam',
            'founded': 2018
        },
        {
            'name': 'CloudNine Systems',
            'description': 'Cloud infrastructure and DevOps consulting company.',
            'logo': 'https://ui-avatars.com/api/?name=CloudNine&background=2563eb&color=fff',
            'website': 'https://cloudnine.tech',
            'industry': 'Cloud Computing',
            'size': '11-50',
            'location': 'Da Nang, Vietnam',
            'founded': 2020
        }
    ]
    
    companies = []
    for data in companies_data:
        company = Company(**data)
        db.session.add(company)
        companies.append(company)
    
    db.session.commit()
    
    # Create sample users
    users_data = [
        {
            'email': 'john@example.com',
            'name': 'John Doe',
            'user_role': 'normal',
            'headline': 'Software Engineer',
            'bio': 'Passionate developer with 5 years of experience in full-stack development.',
            'location': 'Ho Chi Minh City'
        },
        {
            'email': 'jane@example.com',
            'name': 'Jane Smith',
            'user_role': 'normal',
            'headline': 'UX Designer',
            'bio': 'Creative designer focused on user-centered design principles.',
            'location': 'Hanoi'
        },
        {
            'email': 'hr@techcorp.vn',
            'name': 'HR Manager',
            'user_role': 'hr',
            'headline': 'HR Manager at TechCorp',
            'bio': 'Managing talent acquisition and employee engagement.',
            'location': 'Ho Chi Minh City',
            'company_id': 1
        },
        {
            'email': 'admin@hustconnect.com',
            'name': 'Admin User',
            'user_role': 'admin',
            'headline': 'Platform Administrator',
            'bio': 'Managing the HustConnect platform.',
            'location': 'Vietnam'
        }
    ]
    
    users = []
    for data in users_data:
        user = User(
            email=data['email'],
            name=data['name'],
            user_role=data.get('user_role', 'normal'),
            headline=data.get('headline'),
            bio=data.get('bio'),
            location=data.get('location'),
            company_id=data.get('company_id')
        )
        user.set_password('password123')  # Default password for demo
        db.session.add(user)
        users.append(user)
    
    db.session.commit()
    
    # Create sample jobs
    jobs_data = [
        {
            'title': 'Senior Full Stack Developer',
            'description': 'We are looking for an experienced Full Stack Developer to join our team.',
            'location': 'Ho Chi Minh City',
            'job_type': 'full-time',
            'experience_level': 'senior',
            'salary_min': 2000,
            'salary_max': 4000,
            'responsibilities': [
                'Develop and maintain web applications',
                'Write clean, maintainable code',
                'Collaborate with cross-functional teams',
                'Participate in code reviews'
            ],
            'requirements': [
                '5+ years of experience in full-stack development',
                'Proficiency in React and Node.js',
                'Experience with SQL and NoSQL databases',
                'Strong problem-solving skills'
            ],
            'benefits': [
                'Competitive salary',
                'Health insurance',
                'Remote work options',
                'Professional development budget'
            ],
            'company_id': 1,
            'created_by': 3
        },
        {
            'title': 'Junior Frontend Developer',
            'description': 'Great opportunity for a junior developer to grow with our team.',
            'location': 'Hanoi',
            'job_type': 'full-time',
            'experience_level': 'entry',
            'salary_min': 800,
            'salary_max': 1200,
            'responsibilities': [
                'Build user interfaces with React',
                'Work closely with designers',
                'Write unit tests',
                'Learn and apply best practices'
            ],
            'requirements': [
                '0-2 years of experience',
                'Knowledge of HTML, CSS, JavaScript',
                'Familiarity with React is a plus',
                'Eager to learn'
            ],
            'benefits': [
                'Mentorship program',
                'Flexible working hours',
                'Team events',
                'Learning opportunities'
            ],
            'company_id': 2,
            'created_by': 3
        },
        {
            'title': 'DevOps Engineer',
            'description': 'Join our DevOps team to build and maintain cloud infrastructure.',
            'location': 'Da Nang',
            'job_type': 'full-time',
            'experience_level': 'mid',
            'salary_min': 1500,
            'salary_max': 2500,
            'responsibilities': [
                'Manage CI/CD pipelines',
                'Monitor system performance',
                'Automate infrastructure tasks',
                'Ensure security best practices'
            ],
            'requirements': [
                '3+ years DevOps experience',
                'Experience with AWS or GCP',
                'Knowledge of Docker and Kubernetes',
                'Scripting skills (Python, Bash)'
            ],
            'benefits': [
                'Remote-first culture',
                'Equipment allowance',
                'Wellness programs',
                'Stock options'
            ],
            'company_id': 3,
            'created_by': 3
        }
    ]
    
    for data in jobs_data:
        job = Job(**data)
        db.session.add(job)
    
    db.session.commit()
    
    # Create sample blog posts
    posts_data = [
        {
            'author_id': 1,
            'content': 'Just deployed my first Next.js application! Check out the link below 🚀',
            'location': 'Ho Chi Minh City',
            'url': 'https://nextjs.org'
        },
        {
            'author_id': 2,
            'content': 'Working on some exciting new design concepts for our upcoming project. Design thinking is all about empathy! 🎨',
            'location': 'Hanoi'
        },
        {
            'author_id': 1,
            'content': 'Tips for junior developers: \n1. Always read the documentation\n2. Practice coding daily\n3. Build projects\n4. Contribute to open source\n5. Never stop learning!',
            'location': 'Ho Chi Minh City'
        },
        {
            'author_id': 3,
            'content': "We're hiring! Looking for talented developers to join TechCorp. Check out our job postings!",
            'location': 'Ho Chi Minh City'
        }
    ]
    
    posts = []
    for data in posts_data:
        post = BlogPost(**data)
        db.session.add(post)
        posts.append(post)
    
    db.session.commit()
    
    # Add some comments
    comments_data = [
        {
            'post_id': 1,
            'author_id': 2,
            'content': 'Congratulations! Next.js is amazing!'
        },
        {
            'post_id': 1,
            'author_id': 3,
            'content': "Great work! Keep it up!"
        },
        {
            'post_id': 3,
            'author_id': 2,
            'content': 'Great tips! Very helpful for beginners.'
        }
    ]
    
    for data in comments_data:
        comment = Comment(**data)
        db.session.add(comment)
    
    # Add some likes
    posts[0].likes.append(users[1])
    posts[0].likes.append(users[2])
    posts[2].likes.append(users[1])
    
    db.session.commit()
    
    print(f"Created {len(companies)} companies")
    print(f"Created {len(users)} users")
    print(f"Created {len(jobs_data)} jobs")
    print(f"Created {len(posts)} posts")
    print(f"Created {len(comments_data)} comments")
