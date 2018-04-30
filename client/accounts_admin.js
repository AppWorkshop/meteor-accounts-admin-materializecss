var getUsers = function() {
  var configuredFields;
  var profileFilterCriteria;
  if (RolesTree) {
    configuredFields = RolesTree.getAllMyFieldsAsObject(Meteor.userId());
    profileFilterCriteria = RolesTree.copyProfileCriteriaFromUser(Meteor.user(),{});
    // console.log(`configuredFields: ${JSON.stringify(configuredFields,null,2)}`);
    // console.log(`profileFilterCriteria: ${JSON.stringify(profileFilterCriteria,null,2)}`);

  }
  // console.log(`userFilter: ${JSON.stringify(Session.get("userFilter"),null,2)}`);
  // console.log(`userFilterCriteria: ${JSON.stringify(Session.get("userFilterCriteria"),null,2)}`);
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
  canAddUsers() {
    if (RolesTree) { // can add users if I have subordinate roles
      return !_.isEmpty(RolesTree.getAllMySubordinatesAsArray(Meteor.userId()));
    } else {
      return (Roles.userIsInRole(Meteor.userId(), ["admin"]))
    }
  },
  settings() {
    return {
      rowsPerPage: 15,
      showNavigation: "auto",
      multiColumnSort: false,
      filters: ["accountsAdminFilter"],
      fields: [
        {
          key: 'buttons',
          label: '',
          tmpl: Template.tableButtons
        },
        {key: 'createdAt', hidden: true, sortOrder: 0, sortDirection: 'ascending' },
        {key: 'roles', label: 'Roles'},
        {key: 'profile.firstname', label: 'First Name'},
        {key: 'profile.surname', label: 'Surname'},
        {key: 'username', label: 'Username'},
        {key: 'emails.0.address', label: 'Email'}
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
  //   openMaterializeModal($('#infoaccount'));
  // },
  'click .removebtn': function (event, template) {
    event.stopImmediatePropagation();
    Session.set('userInScope', this);
    openMaterializeModal($('#deleteaccount'));
  },

  'click .infobtn': function (event, template) {
    event.stopImmediatePropagation();
    Session.set('userInScope', this);
    openMaterializeModal($('#infoaccount'));
  },

  'click .editbtn': function (event, template) {
    event.stopImmediatePropagation();
    Session.set('userInScope', this);
    Session.set("ACCOUNTS_ADMIN_SHOW_UPDATE_USER", true);
    openMaterializeModal($('#updateaccount'));
  },
  'click #updaterolesbtn': function(event, template) {
    openMaterializeModal($('#updateroles'));
  },
  'click #adduserbtn': function () {
    openMaterializeModal($('#adduser'));
  },
  'click .passwordbtn': function (event, template) {
    event.stopImmediatePropagation();
    Session.set('userInScope', this);
    openMaterializeModal($('#resetPassword'));
  },
  'click #updatefilterbtn': function () {
    openMaterializeModal($('#updateFilter'));
  }
});

Template.accountsAdmin.onCreated(function () {
  Session.set("ACCOUNTS_ADMIN_SHOW_UPDATE_USER", false);
  this.subscribe('roles');

});

Template.accountsAdmin.onRendered(function () {
  // allow materialize modals in pre-0.100 $("#modal").openModal() fashion, and post-0.100 $("#modal").modal('open').
  initializeMaterializeModalMode();
  if (isNewMaterializeModalMode) {
    // need to initialize modals
    $('#deleteaccount').modal();
    $('#infoaccount').modal();
    $('#updateaccount').modal();
    $('#updateroles').modal();
    $('#adduser').modal();
    $('#resetPassword').modal();
    $('#updateFilter').modal();
  }

});

Template.accountsAdmin.onDestroyed(function(){
  if (isNewMaterializeModalMode) {
    // need to initialize modals
    $('#deleteaccount').modal();
    $('#infoaccount').modal();
    $('#updateaccount').modal();
    $('#updateroles').modal();
    $('#adduser').modal();
    $('#resetPassword').modal();
    $('#updateFilter').modal();
  }
});

Template["tableButtons"].helpers({
  canResetPasswords() { // can reset passwords if I have subordinate roles

    return true;
    // if (RolesTree) { // can reset passwords if I have subordinate roles
    //   return !_.isEmpty(RolesTree.getAllMySubordinatesAsArray(Meteor.userId()));
    // } else {
    //   return (Roles.userIsInRole(Meteor.userId(), ["admin"]))
    // }
  },
  isEqual(value1, value2) {
    return (value1 === value2);
  }
});