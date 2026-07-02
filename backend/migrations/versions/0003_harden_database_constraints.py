"""harden database constraints

Revision ID: 0003_harden_database_constraints
Revises: 0002_add_anonymous_users
Create Date: 2026-06-29
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_harden_database_constraints"
down_revision = "0002_add_anonymous_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("obd_codes") as batch_op:
        batch_op.create_check_constraint("ck_obd_codes_urgency", "urgency IN ('low', 'moderate', 'high', 'critical')")
        batch_op.create_check_constraint("ck_obd_codes_drive_safety", "drive_safety IN ('safe', 'caution', 'avoid driving')")

    with op.batch_alter_table("vehicles") as batch_op:
        batch_op.create_check_constraint("ck_vehicles_year_supported", "year >= 1981 AND year <= 2035")
        batch_op.create_check_constraint(
            "ck_vehicles_mileage_supported",
            "mileage IS NULL OR (mileage >= 0 AND mileage <= 1000000)",
        )

    with op.batch_alter_table("scans") as batch_op:
        batch_op.create_index(batch_op.f("ix_scans_vehicle_id"), ["vehicle_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_scans_code"), ["code"], unique=False)
        batch_op.create_foreign_key("fk_scans_code_obd_codes", "obd_codes", ["code"], ["code"], ondelete="RESTRICT")
        batch_op.create_check_constraint("ck_scans_urgency", "urgency IN ('low', 'moderate', 'high', 'critical')")


def downgrade() -> None:
    with op.batch_alter_table("scans") as batch_op:
        batch_op.drop_constraint("ck_scans_urgency", type_="check")
        batch_op.drop_constraint("fk_scans_code_obd_codes", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_scans_code"))
        batch_op.drop_index(batch_op.f("ix_scans_vehicle_id"))

    with op.batch_alter_table("vehicles") as batch_op:
        batch_op.drop_constraint("ck_vehicles_mileage_supported", type_="check")
        batch_op.drop_constraint("ck_vehicles_year_supported", type_="check")

    with op.batch_alter_table("obd_codes") as batch_op:
        batch_op.drop_constraint("ck_obd_codes_drive_safety", type_="check")
        batch_op.drop_constraint("ck_obd_codes_urgency", type_="check")
