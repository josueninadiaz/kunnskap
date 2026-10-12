using Academy.Api.Modules.Identity;

namespace Academy.Api.UnitTests.Identity;

public class PermissionsTests
{
    [Fact]
    public void Students_have_no_administrative_permissions()
    {
        Assert.Empty(Roles.PermissionsByRole[Roles.Student]);
    }

    [Fact]
    public void Editors_can_manage_but_not_publish_content()
    {
        var editor = Roles.PermissionsByRole[Roles.Editor];

        Assert.Contains(Permissions.ContentManage, editor);
        Assert.DoesNotContain(Permissions.ContentPublish, editor);
        Assert.DoesNotContain(Permissions.UsersManage, editor);
    }

    [Fact]
    public void Admins_have_every_permission()
    {
        Assert.Equal(Permissions.All.Order(), Roles.PermissionsByRole[Roles.Admin].Order());
    }

    [Fact]
    public void Every_role_only_references_known_permissions()
    {
        var granted = Roles.PermissionsByRole.Values.SelectMany(p => p);

        Assert.All(granted, permission => Assert.Contains(permission, Permissions.All));
    }
}
