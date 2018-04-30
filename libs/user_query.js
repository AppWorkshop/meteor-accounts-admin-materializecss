getFilteredUserQueryCriteria = function(userId, searchFilterString, searchFilterObject, fields, rolesCriteria, profileFilterCriteria){
  var queryCriteria = [];
  fields = fields || {
    "_id":1,
    "username": 1,
    "profile.name": 1,
    "roles": 1,
    "emails": 1
  };
  if (!RolesTree) {
    // if not an admin user don't show any other user
    if (!Roles.userIsInRole(userId, ['admin']))
      return {_id: userId};
  } else {
    // add the roles clause
    if (rolesCriteria && !_.isEmpty(rolesCriteria)) {
      queryCriteria.push(rolesCriteria);
    }
    // add the profile clause
    if (profileFilterCriteria && !_.isEmpty(profileFilterCriteria)) {
      queryCriteria.push(profileFilterCriteria);
    }
    // add the custom criteria
    if (searchFilterObject && !_.isEmpty(searchFilterObject)) {
      queryCriteria.push(searchFilterObject)
    }
  }
  // convert queryCriteria from array of clauses to the actual clause
  if (queryCriteria.length > 1) { // more than one, so "AND" the clauses together.
    queryCriteria = {$or: [{_id: userId},{$and: queryCriteria}]}; // I can see myself.
  } else if (queryCriteria.length === 1){
    // there's only one clause
    queryCriteria = {$or: [{_id: userId},queryCriteria[0]]}; // I can see myself.
  } else {
    queryCriteria = {}; // there's no criteria.
  }
  return queryCriteria;
};

/**
 * Filter the Meteor.users that this user can see. All criteria is "AND"-ed together.
 * @param {string} userId - the ID of the current user for whom to publish the data
 * @param {string} searchFilterString - string (e.g. from Session) that gets OR-ed to other criteria to search on username, profile.name and emails.
 * @param {object} searchFilterObject - object (e.g. from Session) that gets OR-ed to other criteria for custom search.
 * @param {object} fields - projection object i.e. the set of fields from Meteor.user to publish.
 * @param {array} rolesCriteria - an array of roles (strings), to filter by Meteor.user.roles
 * @param {object} profileFilterCriteria - object with fixed query criteria e.g. to filter users based on profile properties
 * @returns {*} - the MongoDB cursor for matching users
 */
filteredUserQuery = function (userId, searchFilterString, searchFilterObject, fields, rolesCriteria, profileFilterCriteria) {
  fields = fields || {
      "_id":1,
      "username": 1,
      "profile.name": 1,
      "roles": 1,
      "emails": 1
  };
  let queryCriteria = getFilteredUserQueryCriteria(userId, searchFilterString, searchFilterObject, fields, rolesCriteria, profileFilterCriteria);

  // console.log(" ============ finding users with query criteria: " + JSON.stringify(queryCriteria) + "; fields:  " + JSON.stringify(fields));
  var users = Meteor.users.find(queryCriteria, {sort: {'profile.name': 1, 'username': 1, emails: 1},
    fields: fields
  });

  // console.log(" ============ found users: ===============");
  // console.log(JSON.stringify(users.fetch()));
  return users;
};

