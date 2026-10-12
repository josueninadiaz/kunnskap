using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Academy.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AuthRolesAndDataProtection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "data_protection_keys",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    friendly_name = table.Column<string>(type: "text", nullable: true),
                    xml = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_data_protection_keys", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { new Guid("019a1c00-0000-7000-8000-000000000001"), "019a1c00-0000-7000-8000-000000000001", "Student", "STUDENT" },
                    { new Guid("019a1c00-0000-7000-8000-000000000002"), "019a1c00-0000-7000-8000-000000000002", "Instructor", "INSTRUCTOR" },
                    { new Guid("019a1c00-0000-7000-8000-000000000003"), "019a1c00-0000-7000-8000-000000000003", "Editor", "EDITOR" },
                    { new Guid("019a1c00-0000-7000-8000-000000000004"), "019a1c00-0000-7000-8000-000000000004", "Admin", "ADMIN" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "data_protection_keys");

            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("019a1c00-0000-7000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("019a1c00-0000-7000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("019a1c00-0000-7000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("019a1c00-0000-7000-8000-000000000004"));
        }
    }
}
