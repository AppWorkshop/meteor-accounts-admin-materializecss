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

  'click .removebtn': function (event, template) {
    Session.set('userInScope', this);
    $('#deleteaccount').modal('open');
  },

  'click .infobtn': function (event, template) {
    Session.set('userInScope', this);
    $('#infoaccount').modal('open');
  },

  'click .editbtn': function (event, template) {
    Session.set('userInScope', this);
    $('#updateaccount').modal('open');
  },
  'click #updaterolesbtn': function(event, template) {
    $('#updateroles').modal('open');
  }
});

Template.accountsAdmin.onCreated(function () {
  this.subscribe('roles');
  this.autorun(function (computation) {
    Meteor.subscribe('filteredUsers', Session.get('userFilter'), Session.get('userFilterCriteria'), {
      'onReady': function () {},
      'onStop': function (error) {
        if (error) console.error(error);
      }
    });
  });
});

Template.accountsAdmin.onRendered(function () {
  var searchElement = document.getElementsByClassName('search-input-filter');
  if (!searchElement)
    return;
  var filterValue = Session.get("userFilter");

  var pos = 0;
  if (filterValue)
    pos = filterValue.length;

  searchElement[0].focus();
  searchElement[0].setSelectionRange(pos, pos);
  $('#deleteaccount').modal();
  $('#infoaccount').modal();
  $('#updateaccount').modal();
  $('#updateroles').modal();  
});