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

ReactiveTable.publish('filteredUsers', Meteor.users, function () {
  // console.log("filteredUsers publish...");

  var rolesCriteria;
  var profileFilterCriteria;

  var myUserId = this.userId;
  if (myUserId) { // user is logged in
    // console.log("user is logged in: " + this.userId);
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
      "profile.firstname": 1,
      "profile.surname": 1,
      "profile.contactDetails": 1,
      "roles": 1,
      "emails": 1
    };


    // console.log("profileFilterCriteria: " + JSON.stringify(profileFilterCriteria));
    // console.log("myUserId: " + myUserId);
    // console.log("rolesCriteria: " + JSON.stringify(rolesCriteria));
    // console.log("profileFilterCriteria: " + JSON.stringify(profileFilterCriteria));

    return getFilteredUserQueryCriteria(myUserId, undefined, undefined, fields, rolesCriteria, profileFilterCriteria);
  } else {
    // console.log("no userid");
    this.stop();
  }
});

// Subscribe to getting access to user profiles if you're the admin
Meteor.publish('UserProfiles', function (optionalUserIdParam) {
  if (!this.userId) { // kick them out if they're not logged in
    this.stop();
    return;
  }

  let criteria = {};
  if (optionalUserIdParam) {
    criteria._id = optionalUserIdParam;
  }

  // Admin sees every user
  let excludedFields = {fields: {"services": 0}};
  if (Roles.userIsInRole(this.userId, ["admin"])) {
    return Meteor.users.find(criteria, excludedFields);
  } else {
    // superiors see all their own subordinates
    if (RolesTree) {
      let mySubordinatesArray = RolesTree.getAllMySubordinatesAsArray(this.userId);
      if (mySubordinatesArray && !_.isEmpty(mySubordinatesArray)) {
        if (optionalUserIdParam) { // I should be returning a single user, but they also must be a subordinate.
          criteria.roles = {$in: mySubordinatesArray}
        } else { // No single user specified so I need to return myself and all my subordinates.
          criteria["$or"] = [
            {_id: this.userId},
            {roles: {$in: mySubordinatesArray}}
          ];
        }
      } else { // I don't have any subordinates. Just return myself.
        criteria._id = this.userId;
      }
    } else { // I'm not admin and RolesTree hasn't been configured.
      this.stop();
    }
    return Meteor.users.find(criteria, excludedFields);
  }
});