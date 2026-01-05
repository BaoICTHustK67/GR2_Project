"""
Seed script for predefined roadmap templates
Run: python -c "from scripts.seed_roadmaps import seed_roadmaps; seed_roadmaps()"
Or: flask shell -> from scripts.seed_roadmaps import seed_roadmaps; seed_roadmaps()
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import RoadmapTemplate


def seed_roadmaps():
    """Create sample predefined roadmap templates"""
    app = create_app()
    
    with app.app_context():
        # Check if templates already exist
        if RoadmapTemplate.query.count() > 0:
            print("Roadmap templates already exist. Skipping seed.")
            return
        
        templates = [
            {
                "role": "Frontend Developer",
                "level": "Junior",
                "description": "Start your journey as a frontend developer. Learn HTML, CSS, JavaScript, and React to build modern web applications.",
                "cover_image": "/roadmaps/frontend.jpg",
                "estimated_duration": "4-6 months",
                "skills_covered": ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive Design"],
                "steps": [
                    {
                        "id": "step-1",
                        "title": "HTML & CSS Fundamentals",
                        "description": "Master the building blocks of the web. Learn semantic HTML, CSS layouts, flexbox, and grid.",
                        "duration": "2-3 weeks",
                        "skills": ["HTML", "CSS"],
                        "resources": [
                            {"title": "MDN HTML Guide", "url": "https://developer.mozilla.org/en-US/docs/Learn/HTML"},
                            {"title": "CSS-Tricks Flexbox Guide", "url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-2",
                        "title": "JavaScript Basics",
                        "description": "Learn JavaScript fundamentals: variables, functions, arrays, objects, and DOM manipulation.",
                        "duration": "3-4 weeks",
                        "skills": ["JavaScript"],
                        "resources": [
                            {"title": "JavaScript.info", "url": "https://javascript.info/"},
                            {"title": "Eloquent JavaScript", "url": "https://eloquentjavascript.net/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-3",
                        "title": "Git & Version Control",
                        "description": "Learn Git basics, branching, merging, and GitHub workflows.",
                        "duration": "1 week",
                        "skills": ["Git"],
                        "resources": [
                            {"title": "Git Tutorial", "url": "https://www.atlassian.com/git/tutorials"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-4",
                        "title": "React Fundamentals",
                        "description": "Learn React: components, props, state, hooks, and the React ecosystem.",
                        "duration": "4-5 weeks",
                        "skills": ["React"],
                        "resources": [
                            {"title": "React Official Docs", "url": "https://react.dev/learn"},
                            {"title": "React Tutorial", "url": "https://react.dev/learn/tutorial-tic-tac-toe"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-5",
                        "title": "Build Projects",
                        "description": "Apply your skills by building 2-3 portfolio projects. Include a personal website and a React app.",
                        "duration": "3-4 weeks",
                        "skills": ["HTML", "CSS", "JavaScript", "React"],
                        "resources": [
                            {"title": "Frontend Mentor", "url": "https://www.frontendmentor.io/"}
                        ],
                        "completed": False
                    }
                ]
            },
            {
                "role": "Backend Developer",
                "level": "Junior",
                "description": "Learn server-side development with Python and Flask/Django. Master databases, APIs, and deployment.",
                "cover_image": "/roadmaps/backend.jpg",
                "estimated_duration": "5-7 months",
                "skills_covered": ["Python", "Flask", "SQL", "PostgreSQL", "REST APIs", "Docker"],
                "steps": [
                    {
                        "id": "step-1",
                        "title": "Python Fundamentals",
                        "description": "Master Python basics: syntax, data structures, OOP, and file handling.",
                        "duration": "3-4 weeks",
                        "skills": ["Python"],
                        "resources": [
                            {"title": "Python Official Tutorial", "url": "https://docs.python.org/3/tutorial/"},
                            {"title": "Automate the Boring Stuff", "url": "https://automatetheboringstuff.com/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-2",
                        "title": "SQL & Databases",
                        "description": "Learn relational databases, SQL queries, and database design principles.",
                        "duration": "2-3 weeks",
                        "skills": ["SQL", "PostgreSQL"],
                        "resources": [
                            {"title": "SQLBolt", "url": "https://sqlbolt.com/"},
                            {"title": "PostgreSQL Tutorial", "url": "https://www.postgresqltutorial.com/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-3",
                        "title": "Flask Framework",
                        "description": "Build web applications with Flask: routing, templates, forms, and authentication.",
                        "duration": "3-4 weeks",
                        "skills": ["Flask"],
                        "resources": [
                            {"title": "Flask Mega-Tutorial", "url": "https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-4",
                        "title": "REST API Development",
                        "description": "Design and build RESTful APIs. Learn authentication, validation, and documentation.",
                        "duration": "2-3 weeks",
                        "skills": ["REST APIs"],
                        "resources": [
                            {"title": "REST API Tutorial", "url": "https://restfulapi.net/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-5",
                        "title": "Docker & Deployment",
                        "description": "Containerize applications with Docker and deploy to cloud platforms.",
                        "duration": "2 weeks",
                        "skills": ["Docker"],
                        "resources": [
                            {"title": "Docker Getting Started", "url": "https://docs.docker.com/get-started/"}
                        ],
                        "completed": False
                    }
                ]
            },
            {
                "role": "Data Scientist",
                "level": "Junior",
                "description": "Begin your data science journey. Learn Python, statistics, machine learning, and data visualization.",
                "cover_image": "/roadmaps/datascience.jpg",
                "estimated_duration": "6-9 months",
                "skills_covered": ["Python", "Pandas", "NumPy", "Machine Learning", "SQL", "Data Visualization"],
                "steps": [
                    {
                        "id": "step-1",
                        "title": "Python for Data Science",
                        "description": "Learn Python with focus on data manipulation using Pandas and NumPy.",
                        "duration": "4-5 weeks",
                        "skills": ["Python", "Pandas", "NumPy"],
                        "resources": [
                            {"title": "Python Data Science Handbook", "url": "https://jakevdp.github.io/PythonDataScienceHandbook/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-2",
                        "title": "Statistics & Probability",
                        "description": "Learn essential statistics: distributions, hypothesis testing, and probability.",
                        "duration": "3-4 weeks",
                        "skills": ["Statistics"],
                        "resources": [
                            {"title": "Khan Academy Statistics", "url": "https://www.khanacademy.org/math/statistics-probability"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-3",
                        "title": "Data Visualization",
                        "description": "Master data visualization with Matplotlib, Seaborn, and Plotly.",
                        "duration": "2-3 weeks",
                        "skills": ["Data Visualization"],
                        "resources": [
                            {"title": "Matplotlib Tutorial", "url": "https://matplotlib.org/stable/tutorials/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-4",
                        "title": "Machine Learning Fundamentals",
                        "description": "Learn supervised and unsupervised learning with scikit-learn.",
                        "duration": "5-6 weeks",
                        "skills": ["Machine Learning"],
                        "resources": [
                            {"title": "Scikit-learn Tutorial", "url": "https://scikit-learn.org/stable/tutorial/"},
                            {"title": "Andrew Ng's ML Course", "url": "https://www.coursera.org/learn/machine-learning"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-5",
                        "title": "SQL for Data Analysis",
                        "description": "Query databases and perform data analysis with SQL.",
                        "duration": "2 weeks",
                        "skills": ["SQL"],
                        "resources": [
                            {"title": "Mode SQL Tutorial", "url": "https://mode.com/sql-tutorial/"}
                        ],
                        "completed": False
                    },
                    {
                        "id": "step-6",
                        "title": "Capstone Project",
                        "description": "Complete an end-to-end data science project: data collection, analysis, modeling, and presentation.",
                        "duration": "3-4 weeks",
                        "skills": ["Python", "Machine Learning", "Data Visualization"],
                        "resources": [
                            {"title": "Kaggle Competitions", "url": "https://www.kaggle.com/competitions"}
                        ],
                        "completed": False
                    }
                ]
            }
        ]
        
        for t_data in templates:
            template = RoadmapTemplate(
                role=t_data["role"],
                level=t_data["level"],
                description=t_data["description"],
                cover_image=t_data.get("cover_image"),
                estimated_duration=t_data["estimated_duration"],
                steps=t_data["steps"],
                skills_covered=t_data["skills_covered"],
                is_active=True
            )
            db.session.add(template)
        
        db.session.commit()
        print(f"Successfully created {len(templates)} roadmap templates!")


if __name__ == "__main__":
    seed_roadmaps()
