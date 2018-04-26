var getUsers = function() {
  var configuredFields;
  var profileFilterCriteria;
  if (RolesTree) {
    configuredFields = RolesTree.getAllMyFieldsAsObject(Meteor.userId());
    profileFilterCriteria = RolesTree.copyProfileCriteriaFromUser(Meteor.user(),{});

  }
  return filteredUserQuery(Meteor.userId(), Session.get("userFilter"), Session.get("userFilterCriteria"), configuredFields, undefined, profileFilterCriteria);

};

Template.accountsAdmin.helpers({
  users: function () {
    return getUsers();
  },

  email: function () {
    if (this.emails && this.emails.length)
      return this.emails[0].address;

    if (this.services) {
      //Iterate through services
      for (var serviceName in this.services) {
        var serviceObject = this.services[serviceName];
        //If an 'id' isset then assume valid service
        if (serviceObject.id) {
          if (serviceObject.email) {
            return serviceObject.email;
          }
        }
      }
    }
    return "";
  },

  searchFilter: function () {
    return Session.get("userFilter");
  },
  myself: function (userId) {
    return Meteor.userId() === userId;
  },
  isInSuperiorRole() {
    return (Roles.userIsInRole(Meteor.userId(), ["admin"]))
  },

  canResetPasswords() {
    return (Roles.userIsInRole(Meteor.userId(), ["admin"]))
  },
  settings() {
    return {
      collection: getUsers(),
      rowsPerPage: 15,
      showNavigation: "auto",
      filters: ["accountsAdminFilter"],
      fields: [
        {
          key: 'buttons',
          label: '',
          tmpl: Template.tableButtons
        },
        {key: 'createdAt', hidden: true, sortOrder: 0, sortDirection: 'ascending' },
        {key: 'roles', label: 'Roles'},
        {key: 'profile.name', label: 'Name'},
        {key: 'username', label: 'Username'},
        {key: 'email.0.address', label: 'Email'}
      ]
    };
  },
  showUpdateModal() {
    // console.log("showUpdateModal helper");
    return Session.get("ACCOUNTS_ADMIN_SHOW_UPDATE_USER");
  }
});

// search no more than 2 times per second
var setUserFilter = _.throttle(function (template) {
  var search = template.find(".search-input-filter").value;
  Session.set("userFilter", search);
}, 500);

Template.accountsAdmin.events({
  'keyup .search-input-filter': function (event, template) {
    setUserFilter(template);
    return false;
  },
  // 'click .reactive-table tbody tr': function (event) {
  //   Session.set('userInScope', this);
  //   $('#infoaccount').openModal();
  // },
  'click .removebtn': function (event, template) {
    Session.set('userInScope', this);
    $('#deleteaccount').openModal();
  },

  'click .infobtn': function (event, template) {
    Session.set('userInScope', this);
    $('#infoaccount').openModal();
  },

  'click .editbtn': function (event, template) {
    Session.set('userInScope', this);
    Session.set("ACCOUNTS_ADMIN_SHOW_UPDATE_USER", true);
    $('#updateaccount').openModal();
  },
  'click #updaterolesbtn': function(event, template) {
    $('#updateroles').openModal();
  },
  'click #adduserbtn': function () {
    $('#adduser').openModal();
  },
  'click #addparticipantbtn': function () {
    Session.set("template", "addParticipant");
  },
  'click .passwordbtn': function (event, template) {
    Session.set('userInScope', this);
    $('#resetPassword').openModal();
  },
  'click #updatefilterbtn': function () {
    $('#updateFilter').openModal();
  }
});

Template.accountsAdmin.onCreated(function () {
  Session.set("ACCOUNTS_ADMIN_SHOW_UPDATE_USER", false);

  this.subscribe('roles');
  // this.autorun(function (computation) {
  //   Meteor.subscribe('filteredUsers', Session.get('userFilter'), Session.get('userFilterCriteria'), {
  //     'onReady': function () {},
  //     'onStop': function (error) {
  //       if (error) console.error(error);
  //     }
  //   });
  // });
});

Template.accountsAdmin.onRendered(function () {
  let searchElement = document.getElementsByClassName('reactive-table-input');
  if (!searchElement)
    return;
  let filterValue = Session.get("userFilter");

  let pos = 0;
  if (filterValue)
    pos = filterValue.length;

  searchElement[0].focus();
  searchElement[0].setSelectionRange(pos, pos);
});

Template["tableButtons"].helpers({
  canResetPasswords() {
    return (Roles.userIsInRole(Meteor.userId(), ["admin"]))
  }
});