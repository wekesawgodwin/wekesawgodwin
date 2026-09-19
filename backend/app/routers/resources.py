from .. import models, schemas
from .crud import build_crud_routers

skills_public, skills_admin = build_crud_routers(
    models.Skill, schemas.SkillIn, schemas.SkillOut, "skills", "skills"
)
services_public, services_admin = build_crud_routers(
    models.Service, schemas.ServiceIn, schemas.ServiceOut, "services", "services"
)
projects_public, projects_admin = build_crud_routers(
    models.Project, schemas.ProjectIn, schemas.ProjectOut, "projects", "projects"
)

routers = [
    skills_public, skills_admin,
    services_public, services_admin,
    projects_public, projects_admin,
]
