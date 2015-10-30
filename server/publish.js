Meteor.publish('roles', function () {
  var criteria = {};
  // am I admin?
  var isAdmin = Roles.userIsInRole(this.userId, ['admin']);

  // This user can see all of the roles it can administer, or all roles if no roles hierarchy is defined.
  if (!isAdmin && RolesTree) { // admin sees all roles, everyone else sees the roles below their own.
    var rolesICanAdminister = RolesTree.getAllMySubordinatesAsArray(this.userId);
    // I might have a few roles.
    // now, rolesICanAdminister contains an array of role names that I can administer. Filter by this array.
    criteria["name"] = {$in: rolesICanAdminister};
  }

  return Meteor.roles.find(criteria);
});

Meteor.publish('filteredUsers', function (filter) {
  var rolesCriteria;
  var profileFilterCriteria;

  var myUserId = this.userId;
  // if we have a roles hierarchy, then only show users in subordinate roles
  // This user can see all of the roles it can administer, or all roles if no roles hierarchy is defined.
  if (RolesTree) {
    var rolesICanAdminister = RolesTree.getAllMySubordinatesAsArray(myUserId);
    // I might have a few roles.
    rolesCriteria = rolesCriteria || {}; // initialize if needed.
    rolesCriteria["roles"] = {$in: rolesICanAdminister};

    // we'll "OR" together the profile filters
    var meteorUser = Meteor.users.findOne({"_id":myUserId});

    var rolesArray = Roles.getRolesForUser(myUserId);
    for (var roleIndex in rolesArray) {
      if (meteorUser.profile && rolesArray.hasOwnProperty(roleIndex)) {
        // find this role in the hierarchy
        var thisRole = RolesTree.findRoleInHierarchy(rolesArray[roleIndex]);
        // copy the profile filters
        if (thisRole && thisRole.profileFilters) { // it might not be in our hierarchy

          // loop through the profile filters (if any)
          for (var filterIndex in thisRole.profileFilters) {
            if (thisRole.profileFilters.hasOwnProperty(filterIndex)) {
              var thisProfileFilter = thisRole.profileFilters[filterIndex];
              // a profile filter is an array of property names to copy from the user's profile
              if (meteorUser.profile.hasOwnProperty(thisProfileFilter)) {
                // OK let's copy it to our criteria
                profileFilterCriteria = profileFilterCriteria || {}; // initialize if needed.
                profileFilterCriteria["profile." + thisProfileFilter] = meteorUser.profile[thisProfileFilter];
              }
            }
          }
        }

      }
    }
  }

  //console.log("profileFilterCriteria: " + JSON.stringify(profileFilterCriteria));

  return filteredUserQuery(myUserId, filter, rolesCriteria, profileFilterCriteria);
});