Meteor.methods({

  adminAccountsCreateUser: function (newUserObject, direct) {
		var user = Meteor.user();

		// ensure the user is logged in
		if (!user) {
			throw new Meteor.Error(401, "You need to login to create accounts");
		}

		// if the new user has roles, ensure they can be applied by the current user.
		var thisUsersRoles = [];
		if (newUserObject && newUserObject.roles) {
			var newUsersRoles = newUserObject.roles;

			// ensure that the user is allowed to assign the roles of the new user object
			if (RolesTree) {
				var rolesICanAdminister = RolesTree.getAllMySubordinatesAsArray(Meteor.userId());
				// now, rolesICanAdminister contains an array of role names that I can administer. As long as all of the new
				// users' roles are in the list, we can go ahead.
				if (!_.every(newUsersRoles, function (thisRole) { // If I can't administer EVERY one of newUsersRoles ...
						return _.contains(rolesICanAdminister, thisRole); // true if I can administer this role
					})) {

					throw new Meteor.Error(403, "You aren't allowed to assign one of the new users' roles.");
				}
			} else {
				// ensure the user is an admin.
				if (!Roles.userIsInRole(user, roles)) {
					throw new Meteor.Error(403, "You don't have one of the required roles.");
				}
			}
		} // no roles on this user object.

		// copy all the specified profile data from MY user object. Copy all of the specified new-user roles for each one of
		// MY roles.
		var rolesForNewUser = [];
		if (RolesTree) {
			for (var roleIndex in user.roles) { // for each of my own roles
				if (user.roles.hasOwnProperty(roleIndex)) {
					// find this role in the hierarchy
					var thisRole = RolesTree.findRoleInHierarchy(user.roles[roleIndex]);
					if (thisRole) { // might not be in the hierarchy
						if (thisRole.profileFilters && user.profile) { // copy ALL my roles' profile filters to the new user
							// copy the profile filters
							// loop through the profile filters (if any)
							for (var filterIndex in thisRole.profileFilters) {
								if (thisRole.profileFilters.hasOwnProperty(filterIndex)) {
									var thisProfileFilter = thisRole.profileFilters[filterIndex];
									// a profile filter is an array of property names to copy from the user's profile
									if (user.profile.hasOwnProperty(thisProfileFilter)) { // Do I have the property on my own profile?
										// OK let's copy it to our criteria
										if (!newUserObject.profile) {
											newUserObject.profile = {};
										}

										newUserObject.profile[thisProfileFilter] = user.profile[thisProfileFilter];
									}
								}
							}

						}
						if (thisRole.defaultNewUserRoles) { // copy all of the default roles to the new user
							// add all of the default new user roles to this user
							rolesForNewUser = _.union(rolesForNewUser, thisRole.defaultNewUserRoles);
							// get rid of "pending" if it's there
							rolesForNewUser = _.without(rolesForNewUser,"self-registered");
						}
					}
				}
			}
		} else {
			if (typeof GetMeteorSettingsValue !== "undefined") {
        rolesForNewUser = GetMeteorSettingsValue("juto.accountsAdminDefaultRoles");
      } else if (Meteor.settings.juto && Meteor.settings.juto.accountsAdminDefaultRoles) {
        rolesForNewUser = Meteor.settings.juto.accountsAdminDefaultRoles;
			}
		}

		newUserObject.creationChannel = 'admin-accounts'; // so we can identify how this was created.
		if (newUserObject.profile && newUserObject.profile.contactDetails && newUserObject.profile.contactDetails.emailAddress) {
			newUserObject.email = newUserObject.profile.contactDetails.emailAddress;
		}

		var newID;
		// console.log(`creating new user object: ${JSON.stringify(newUserObject,null,2)}`);
		if (!direct) {
			newID = Accounts.createUser(
				newUserObject
			);
		} else {
			// Insert directly
			newID = Meteor.users.insert(newUserObject)
		}

		// add the user to the "teacher" role or other configured default roles
		if (rolesForNewUser && rolesForNewUser.length) {
			Roles.addUsersToRoles(newID, rolesForNewUser);
		}

		return newID;
	},
  adminAccountsUpdateUser: function(id, updDoc) {
    var user = Meteor.user();
    if (!user || (!RolesTree.isUserCanAdministerUser(user._id,id) && !Roles.userIsInRole(user, ['admin']))) {
      throw new Meteor.Error(401, "You don't have privileges to update this user.");
    }

    Meteor.users.update({_id: id}, updDoc);

  },
  adminAccountsChangePasswordForUser: function (userId, newPassword) {
    var user = Meteor.user();

    // ensure the user is logged in
    if (!user) {
      throw new Meteor.Error(401, "You need to be logged in!");
    }

    var canAdminister = false;
    if (RolesTree) {
      if (RolesTree.isUserCanAdministerUser(user._id, userId)) {
        canAdminister = true;
      }
    }

    if (userId === user._id) { // if it's me
      canAdminister = true; // I can change my own password
    }

    if (!canAdminister) {
      throw new Meteor.Error(401, "You don't have permission to change this password");
    }
    if (Meteor.isServer) {
      Accounts.setPassword(userId, newPassword, true);
    }
  },
	deleteUser: function(userId) {
		check(userId, String);

		var user = Meteor.user();
    if (RolesTree) {
      if (!user || (!Roles.userIsInRole(user, ['admin']) && !RolesTree.isUserCanAdministerUser(user._id,userId))) {
        throw new Meteor.Error(401, "You don't have privileges to delete user.");
      }
    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to delete a user.");
    }
		if (user._id === userId)
			throw new Meteor.Error(422, 'You can\'t delete yourself.');

		// remove the user
		Meteor.users.remove(userId);
	},

	addUserRole: function(userId, role) {
		check(userId, String);
		check(role, String);

		var user = Meteor.user();
    if (RolesTree) {
      if (!user || (!Roles.userIsInRole(user, ['admin']) && !RolesTree.isUserCanAdministerRole(user._id, role))) {
        throw new Meteor.Error(401, "You don't have privileges to assign role " + role + " to users.");
      }
    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to update a user.");
    }
		if (user._id == userId)
			throw new Meteor.Error(422, 'You can\'t update yourself.');

		// handle invalid role
		if (Meteor.roles.find({name: role}).count() < 1 )
			throw new Meteor.Error(422, 'Role ' + role + ' does not exist.');

		// handle user already has role
		if (Roles.userIsInRole(userId, role))
			throw new Meteor.Error(422, 'Account already has the role ' + role);

		// add the user to the role
		Roles.addUsersToRoles(userId, role);
	},

	removeUserRole: function(userId, role) {
		check(userId, String);
		check(role, String);

		var user = Meteor.user();
    if (RolesTree) {
      if (!user || (!RolesTree.isUserCanAdministerRole(user._id, role) && !Roles.userIsInRole(user, ['admin'])) ) {
        throw new Meteor.Error(401, "You don't have privileges to remove role " + role + " from users.");
      }

      // If we *do* remove this role from this user, will they still exist in the hierarchy that we can administer?
      var remainingRoles = _.without(Roles.getRolesForUser(userId), role);

      // is there one role remaining that we can administer? We don't want the user to "disappear" from our hierarchy
      var oneRemaining = _.find(remainingRoles, function (remainingRole) {
        return RolesTree.isUserCanAdministerRole(user._id, remainingRole);
      });

      if (!oneRemaining) {
        throw new Meteor.Error('last-manageable-role', "Last Manageable Role","Add another role before removing " + role + " from this user.");
      }

    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to update a user.");
    }
		if (user._id == userId)
			throw new Meteor.Error(422, 'You can\'t update yourself.');

		// handle invalid role
		if (Meteor.roles.find({name: role}).count() < 1 )
			throw new Meteor.Error(422, 'Role ' + role + ' does not exist.');

		// handle user already has role
		if (!Roles.userIsInRole(userId, role))
			throw new Meteor.Error(422, 'Account does not have the role ' + role);

		Roles.removeUsersFromRoles(userId, role);
	},

	addRole: function(role) {
		check(role, String);

		var user = Meteor.user();
		if (!user || !Roles.userIsInRole(user, ['admin']))
			throw new Meteor.Error(401, "You need to be an admin to add a role.");

		// handle existing role
		if (Meteor.roles.find({name: role}).count() > 0 )
			throw new Meteor.Error(422, 'Role ' + role + ' already exists.');

		Roles.createRole(role);
	},

	removeRole: function(role) {
		check(role, String);

		var user = Meteor.user();
		if (!user || !Roles.userIsInRole(user, ['admin']))
			throw new Meteor.Error(401, "You need to be an admin to remove a role.");

		// handle non-existing role
		if (Meteor.roles.find({name: role}).count() < 1 )
			throw new Meteor.Error(422, 'Role ' + role + ' does not exist.');

		if (role === 'admin')
			throw new Meteor.Error(422, 'Cannot delete role admin');

		// remove the role from all users who currently have the role
		// if successfull remove the role
		Meteor.users.update(
			{roles: role },
			{$pull: {roles: role }},
			{multi: true},
			function(error) {
				if (error) {
					throw new Meteor.Error(422, error);
				} else {
					Roles.deleteRole(role);
				}
			}
		);
	},

	updateUserInfo: function(id, property, value) {
		check(id, String);
		check(property, String);
		check(value, String);

		var user = Meteor.user();
    if (!user || (!RolesTree.isUserCanAdministerUser(user._id,id) && !Roles.userIsInRole(user, ['admin']))) {
      throw new Meteor.Error(401, "You don't have privileges to update this user.");
    } else {
      if (!user || !Roles.userIsInRole(user, ['admin']))
        throw new Meteor.Error(401, "You need to be an admin to update a user.");
    }
		if (property !== 'profile.name')
			throw new Meteor.Error(422, "Only 'name' is supported.");

		obj = {};
		obj[property] = value;
		Meteor.users.update({_id: id}, {$set: obj});

	}
});