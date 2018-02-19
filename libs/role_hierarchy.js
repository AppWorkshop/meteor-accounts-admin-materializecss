RolesTree = undefined;

/**
 * Create a new role hierarchy
 * @param {object} jsTree - a tree structure matching the structure:
 *    <pre>{roleName:"foo", children: [{roleName:"fooChild", children:[], defaultNewUserRoles: ["pendingApproval"], visibleUserFields: {"_id":1,"username": 1,"profile.name": 1,"roles": 1}]
 *    defaultNewUserRoles: ["fooChild"],  // users created by foo are given the fooChild role
 *    profileFilters:["school","classId"], // foo users can see fooChild users whose profile.school and profile.classId match their own.
 *    visibleUserFields: {"emails": 1} // fields the foo users can see on their subordinates. foo can also see everything that fooChild can see.
 *    }</pre>
 */
RolesHierarchy = function (jsTree) {
  this.roleName = jsTree.roleName;
  if (jsTree.subordinates) {
    var children = [];
    for (var thisChild in jsTree.subordinates) {
      if (jsTree.subordinates.hasOwnProperty(thisChild)) {
        children.push(new RolesHierarchy(jsTree.subordinates[thisChild]));
      }
    }
    this.subordinates = children;
  }
  this.defaultNewUserRoles = jsTree.defaultNewUserRoles;
  this.profileFilters = jsTree.profileFilters;
  this.visibleUserFields = jsTree.visibleUserFields;
};
/**
 * Find a role in the hierarchy by name
 * @param {string} roleName - the name of the role to find
 * @returns {*} -
 */
RolesHierarchy.prototype.findRoleInHierarchy = function (roleName) {
  // is it this one?
  if (this.roleName === roleName) {
    return this;
  }
  // is it one of the immediate children of this one?
  if (this.subordinates) {
    let res = false;
    for (var thisChild in this.subordinates) {
      res = this.subordinates[thisChild].findRoleInHierarchy(roleName);
    }
    return res;
  }

  return false;
};
/**
 * Return the subordinate role of the given seniorRoleName
 * @param {string} seniorRoleName - the name of the senior role
 * @param {string} subordinateRoleName - the name of the subordinate role
 * @returns {object} - the role of the subordinate, or false if not found.
 */
RolesHierarchy.prototype.getRoleSubordinate = function (seniorRoleName, subordinateRoleName) {
  // find the senior role in the hierarchy
  var seniorRole = this.findRoleInHierarchy(seniorRoleName);
  // see if the senior role has a subordinate matching the subordinate role
  return seniorRole.findRoleInHierarchy(subordinateRoleName);

};

/**
 * Get the names of subordinate roles as an array
 * @param {string} seniorRoleName - the name of the senior role
 * @returns {Array} - the subordinate roles if any.
 */
RolesHierarchy.prototype.getAllSubordinatesAsArray = function (seniorRoleName) {

  // find the senior role in the hierarchy
  var seniorRole = this.findRoleInHierarchy(seniorRoleName);

  var subordinateRoles = [];
  if (seniorRole.subordinates && seniorRole.subordinates.length > 0) {
    // add each subordinate's role name and it's subordinates' names.
    for (var thisRole in seniorRole.subordinates)
      if (seniorRole.subordinates.hasOwnProperty(thisRole)) {
        // add our subordinate's name
        subordinateRoles.push(seniorRole.subordinates[thisRole].roleName);
        // add our subordinate's subordinates' names.
        subordinateRoles.push(seniorRole.subordinates[thisRole].getAllSubordinatesAsArray(seniorRole.subordinates[thisRole].roleName));
      }
    subordinateRoles = _.flatten(subordinateRoles);
  }
  return subordinateRoles;
};

/**
 * Get an array of all of the role names that the current user can administer
 * @param myUserId the userID of the current user
 * @returns {Array} an array of role names that the current user can administer
 */
RolesHierarchy.prototype.getAllMySubordinatesAsArray = function (myUserId) {
  var rolesICanAdminister = [];

  var myUserObj;
  myUserObj = Meteor.users.findOne(myUserId);


  // I might have a few roles.
  if (myUserObj) {
    var myRoles = myUserObj.roles || [];
    // for each role I have, add the subordinate roles to the list of roles I can administer.
    for(var thisRole in myRoles) {
      if (myRoles.hasOwnProperty(thisRole)) {
        // add this role
        var thisRoleObjInHierarchy = this.findRoleInHierarchy(myRoles[thisRole]);
        if (thisRoleObjInHierarchy) {
          // add all of the subordinate role names from the hierarchy
          rolesICanAdminister = _.union(rolesICanAdminister, thisRoleObjInHierarchy.getAllSubordinatesAsArray(myRoles[thisRole]));
        } // role not in hierarchy. That's OK, but we don't know anything about it.
      }
    }
  }

  return rolesICanAdminister;
};

/**
 * Get an object of all of the Meteor.user fields that the current user can see
 * @param myUserId the userID of the current user
 * @returns {object} an object of Meteor.user field names that the current user can see, suitable for inclusion as a "fields" property in a Collection query.
 */
RolesHierarchy.prototype.getAllMyFieldsAsObject = function (myUserId) {
  var fieldsICanSee;

  var myUserObj;
  myUserObj = Meteor.users.findOne(myUserId);


  // I might have a few roles.
  if (myUserObj) {
    var myRoles = myUserObj.roles || [];

    // I can see everything my subordinates can see, plus maybe some extra fields.
    var rolesICanAdminister = this.getAllMySubordinatesAsArray(myUserId);
    var allRolesICanSee = _.union(myRoles, rolesICanAdminister);
    // for each role I have, add the subordinate's fields to the set of fields I can see.
    for(var thisRole in allRolesICanSee) {
      if (allRolesICanSee.hasOwnProperty(thisRole)) {
        // add this role
        var thisRoleObjInHierarchy = this.findRoleInHierarchy(allRolesICanSee[thisRole]);
        if (thisRoleObjInHierarchy) {
          // add all of the subordinate role names from the hierarchy
          fieldsICanSee = fieldsICanSee || {}; // initialize if necessary.
          fieldsICanSee = _.extend(fieldsICanSee, thisRoleObjInHierarchy.visibleUserFields);
        } // role not in hierarchy. That's OK, but we don't know anything about it.
      }
    }
  }

  return fieldsICanSee;
};

/**
 * returns true if the given userId can administer the given role.
 * @param userId meteor userId of the user we're checking
 * @param roleName
 */
RolesHierarchy.prototype.isUserCanAdministerRole = function(userId, roleName) {
  var allSubordinateRoles = RolesTree.getAllMySubordinatesAsArray(userId);
  return _.contains(allSubordinateRoles, roleName);
};

/**
 * returns true if the given adminId can administer the given userId.
 * @param adminId the meteor userId of the user we're checking
 * @param subordinateId the meteor userid of the subordinate to check
 */
RolesHierarchy.prototype.isUserCanAdministerUser= function(adminId, subordinateId) {
  var allAdminSubordinateRoles = RolesTree.getAllMySubordinatesAsArray(adminId);
  var subordinateUserRoles = [];
  var subordinateObj = Meteor.users.findOne(subordinateId);
  if (subordinateObj) {
    subordinateUserRoles = subordinateObj.roles;
  }

  for(var subordinateRoleIndex in subordinateUserRoles) {
    if (subordinateUserRoles.hasOwnProperty(subordinateRoleIndex)) {
      if (_.contains(allAdminSubordinateRoles, subordinateUserRoles[subordinateRoleIndex])) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Copy the given user's profile properties (as specified in RolesTree) as query criteria.
 * @param {object} meteorUser - the user whose profile to copy
 * @param {object} profileFilterCriteria - existing profileFilterCriteria. Note that if any properties are already specified, they may
 *  get overwritten.
 * @returns {*} the query criteria to ensure only users with the same profile property values will be returned.
 */
RolesHierarchy.prototype.copyProfileCriteriaFromUser = function(meteorUser, profileFilterCriteria) {
  if (meteorUser && RolesTree) {
    var rolesArray = Roles.getRolesForUser(meteorUser._id);
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
  return profileFilterCriteria;
};

// client and server
// if roles hierarchy is defined
if (Meteor.settings &&
  Meteor.settings.public &&
  Meteor.settings.public.accountsAdmin &&
  Meteor.settings.public.accountsAdmin.rolesHierarchy) {

  // build our roles
  RolesTree = new RolesHierarchy(Meteor.settings.public.accountsAdmin.rolesHierarchy);

  if (Meteor.isServer) {
    global.RolesTree = RolesTree;
  }
}