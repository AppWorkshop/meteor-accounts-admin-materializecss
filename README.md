# Accounts Admin UI (MaterializeCSS)

A roles based account management system using [materialize css](http://materializecss.com/) for Meteor.

This is a fork of the [Bootstrap version](https://github.com/hharnisc/meteor-accounts-admin-ui-bootstrap-3).

## Screen Recording

The screen recording below should give you an idea of what this does. 

![accounts-admin-demo](https://user-images.githubusercontent.com/1751645/39414333-dc88989a-4c68-11e8-85cf-83e6a794c34c.gif)

**Table of Contents**

- [Quick Start](#quick-start)
- [Iron Router Integration](#iron-router-integration)
- [Roles Hierarchy](#roles-hierarchy)
- [TODO](#todo)
- [History](#history)
- [Contributing](#contributing)


## Quick Start

Take a look at the [example meteor app](https://github.com/AppWorkshop/meteor-accounts-admin-materializecss-example) :

```sh
git clone https://github.com/AppWorkshop/meteor-accounts-admin-materializecss-example admin-example
cd admin-example
meteor npm install
meteor --settings settings.json
```

You need to create a new user and then set the 'admin' role to that user. E.g. :

```sh
meteor shell
> let userid = Accounts.createUser({ 
    username: 'admin', 
    email: 'admin@example.com', 
    password: 'password123', 
    profile: { 
      firstname: 'Admin', 
      surname: 'User', 
      contactDetails: { 
        mobilePhone: '0411111111', 
        emailAddress: 'admin@example.com' 
      }
    }
  });
  Roles.addUsersToRoles(userid, ["admin"]);
```

## Router Integration

This tool plays nicely with FlowRouter or Iron Router.

Effectively, it just defines a `accountsAdmin` Spacebars template, so you can attach it to a route as you please.

## Roles Hierarchy

In your settings.json, you can define a hierarchy of roles:

```javascript
{
  "public": {
    "accountsAdmin" : {
      "rolesHierarchy": {
        "roleName": "admin",
        "subordinates": [
          {
            "roleName": "user-admin",
            "subordinates": [
              {
                "roleName": "schoolAdmin",
                "subordinates": [
                  {
                    "roleName": "teacher",
                    "subordinates": [
                      {"roleName": "student",
                       // a student can see the following fields
                       visibleUserFields: {"_id":1,"username": 1,"profile.name": 1,"roles": 1}
                      }
                    ],
                    // new users created by a teacher get the student role
                    "defaultNewUserRoles":["student"],

                    // new users created by a teacher get the teacher's profile.school and profile.classId
                    "profileFilters":["school","classId"]

                    // a teacher can see everything a student can see, also email addresses
                    visibleUserFields: {"emails": 1}
                  }
                ],
                "profileFilters":["school"]
              }
            ],
            "defaultNewUserRoles":["teacher"]

          }
        ],
        "defaultNewUserRoles":["teacher"]
      }
    }
  }
}
```

A global object, RolesTree, allows you to query the hierarchy. E.g.

```js
if (RolesTree.getRoleSubordinate("admin","student")) {
  console.log("admin has a student subordinate");
}

var subordinateRoles = RolesTree.getAllSubordinatesAsArray("admin");
// ["user-admin","schoolAdmin","teacher","student"]

var roleObj = findRoleInHierarchy("teacher");
// {roleName: "teacher",
// subordinates: [
//   {roleName: "student"}
// ],
// defaultNewUserRoles:["student"],
// profileFilters:["school","classId"]}


var mySubordinates = RolesTree.getAllMySubordinatesAsArray(Meteor.userId())
// an array of role names whose roles are below my own roles (union).

var canIAdminister = RolesTree.isUserCanAdministerRole(Meteor.userId(),"teacher");
// true if I have the role "admin", "user-admin" or "schoolAdmin"; false otherwise.

var canIAdminister = RolesTree.isUserCanAdministerUser(Meteor.userId(),"baddeadbeef");
// true if the user with id "baddeadbeef" has any role that is a subordinate role of any of my own roles.


```

## TODO

- ~~Implement UI to create/remove roles (currently done at Meteor.startup)~~ DONE
- Configurable fields
- ~~Implement pagination (currently relies on search to find users)~~
- Write tests
- User impersonation (for admins)

## History

**Version:** 0.5.0
- Refactor to use `aslagle:reactive-table` to provide paginated subscription, more robust searching and an example app.

**Version:** 0.3.0
- Filter on all fields specified in RolesTree 'visibleUserFields' property.

**Version:** 0.2.25
- Explicitly use the session package.

**Version:** 0.2.24
- Fix issue where user would disappear from the UI if removed from the roles hierarchy (by having all relevant roles removed). Fixed by preventing role removal until another one has been added.

**Version:** 0.2.23
- merge pull request [pr9](https://github.com/AppWorkshop/meteor-accounts-admin-materializecss/pull/9) from @devgrok
    - cosmetic change to "manage roles" button, no functional changes

**Version:** 0.2.22
- merge pull request [pr2](https://github.com/AppWorkshop/meteor-accounts-admin-materializecss/pull/2) from @mitar
    - minor fixes, no functional changes

**Version:** 0.2.21
- move "copy profile filter" function to RolesTree.
- Fix bug where profile fields were not being used as criteria.

**Version:** 0.2.20
- Use RolesTree-specified profile filter criteria in client query.

**Version:** 0.2.19
- The beginning of t9n support.

**Version:** 0.2.18
- Fix bug preventing non-admins from assigning roles.
- Allow additional Session "userFilterCriteria" object to filter users

**Version:** 0.2.17
- Tighten up security. Only publish a few fields of Meteor.user .
- RolesTree: Add ability to configure additional fields to publish.

**Version:** 0.2.16
- RolesTree: Filter: also show users who don't have ANY role, as long as the
profileFilter matches.

**Version:** 0.2.15
- Fix publication so user can only see themselves and subordinates.

**Version:** 0.2.14
- Roles bootstrap (minor change)

**Version:** 0.2.13
- Roles bug fix

**Version:** 0.2.12
- fix a few bugs (by removing use of underscore _.each).
- Add template helper.
- Filter Meteor.users and Roles publications based on the roles that the user should be able to see.
- Update server-side methods to allow updates of users by others with more senior roles.

**Version:** 0.2.11
- Add Roles hierarchy functionality.

**Latest Version:** 0.2.10
- sort by name, username and then email.
- add display of username

**Version:** 0.2.9
- Use event handlers to trigger modals, rather than a single event binding (which prevented modals being triggered for newly-inserted DOM elements)

**Version:** 0.2.8
- Update readme with screenshots
- Fix minor UI bug with placeholder overlapping username

**Version:** 0.2.7
- materializecss port (forked from upstream here)
- meteor 0.9.0 package format updates

**Version:** 0.2.6
- Remove hard dependency to bootstrap-3 (so less-bootstrap-3 or similar can be used). (Thanks to [@johnm](https://github.com/johnm))
- Documentation updates
- Fixes [Issue #18](https://github.com/hharnisc/meteor-accounts-admin-ui-bootstrap-3/issues/18)

**Version:** 0.2.5

- Bump roles version; v1.2.8 is Blaze-compatible (thanks to [@alanning](https://github.com/alanning)!)

**Version:** 0.2.4

- Support [changes made in Meteor 0.8.0-rc0](https://github.com/meteor/meteor/issues/1930)
- Fixes [Issue #7](https://github.com/hharnisc/meteor-accounts-admin-ui-bootstrap-3/issues/7)
- Update to bootstrap-3.1.1

**Version:** 0.2.3

- Now supports changing usernames from admin interface (thanks to [@djkmiles](https://github.com/djkmiles)!)

**Version:** 0.2.2

- Fixed bugs due to fallout from removing bootstrap-modal

**Version:** 0.2.1

- Removed dependency to bootstrap-modal

**Version:** 0.2.0

- Added UI to create/remove roles

**Version:** 0.1.0

- Created a basic UI to find users, delete users, and modify roles.


## Contributing

If you've got a change you think would benefit the community send me a pull request.

**Contributors**
- [@djkmiles](https://github.com/djkmiles)
- [@alanning](https://github.com/alanning)
- [@johnm](https://github.com/johnm)
