using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Academy.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CatalogContentImport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_courses_status_school_id",
                table: "courses");

            migrationBuilder.DropCheckConstraint(
                name: "ck_courses_estimated_minutes",
                table: "courses");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:unaccent", ",,");

            migrationBuilder.AlterColumn<int>(
                name: "estimated_minutes",
                table: "courses",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                table: "courses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "source_path",
                table: "courses",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_courses_status_school_id_sort_order",
                table: "courses",
                columns: new[] { "status", "school_id", "sort_order" });

            migrationBuilder.AddCheckConstraint(
                name: "ck_courses_estimated_minutes",
                table: "courses",
                sql: "estimated_minutes IS NULL OR estimated_minutes > 0");

            migrationBuilder.AddCheckConstraint(
                name: "ck_courses_published_duration",
                table: "courses",
                sql: "status <> 'Published' OR estimated_minutes IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_courses_status_school_id_sort_order",
                table: "courses");

            migrationBuilder.DropCheckConstraint(
                name: "ck_courses_estimated_minutes",
                table: "courses");

            migrationBuilder.DropCheckConstraint(
                name: "ck_courses_published_duration",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "sort_order",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "source_path",
                table: "courses");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:unaccent", ",,");

            migrationBuilder.AlterColumn<int>(
                name: "estimated_minutes",
                table: "courses",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_courses_status_school_id",
                table: "courses",
                columns: new[] { "status", "school_id" });

            migrationBuilder.AddCheckConstraint(
                name: "ck_courses_estimated_minutes",
                table: "courses",
                sql: "estimated_minutes > 0");
        }
    }
}
