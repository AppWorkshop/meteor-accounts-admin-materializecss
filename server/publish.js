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

ReactiveTable.publish('filteredUsers', function (searchString, searchCriteriaObject) {
  check(searchString, Match.OneOf(String, undefined, null));
  check(searchCriteriaObject, Match.OneOf(Object, undefined, null));

  var rolesCriteria;
  var profileFilterCriteria;

  var myUserId = this.userId;
  if (myUserId) { // user is logged in
    var fields;
    // if we have a roles hierarchy, then only show users in subordinate roles
    // This user can see all of the roles it can administer, or all roles if no roles hierarchy is defined.
    if (RolesTree) {
      var rolesICanAdminister = RolesTree.getAllMySubordinatesAsArray(myUserId);
      // I might have a few roles.
      rolesCriteria =
      {
        $or: [
          {"roles": {$in: rolesICanAdminister}},
          {"roles": {$size: 0}}
        ]
      };

      // we'll "OR" together the profile filters
      var meteorUser = Meteor.users.findOne({"_id": myUserId});

      profileFilterCriteria = RolesTree.copyProfileCriteriaFromUser(meteorUser, profileFilterCriteria);
      fields = RolesTree.getAllMyFieldsAsObject(myUserId); // get the visible Meteor.user fields that this user can see on subordinates.
    }
    fields = fields || { // default field set if none specified.
        "_id": 1,
        "username": 1,
        "profile.name": 1,
        "roles": 1,
        "emails": 1
      };


    //console.log("profileFilterCriteria: " + JSON.stringify(profileFilterCriteria));
    //console.log("myUserId: " + myUserId);
    //console.log("filter: " + JSON.stringify(filter));
    //console.log("rolesCriteria: " + JSON.stringify(rolesCriteria));
    //console.log("profileFilterCriteria: " + JSON.stringify(profileFilterCriteria));

    return filteredUserQuery(myUserId, searchString, searchCriteriaObject, fields, rolesCriteria, profileFilterCriteria);
  } else {
    this.stop();
  }
});