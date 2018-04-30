Template.updateAccountModalInner.helpers({
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
  notMe: function () {
    return (Meteor.userId() !== this._id);
  },
  userInScope: function () {
    return Session.get('userInScope');
  },

  unsetRoles: function () {
    var allRoles = _.pluck(Roles.getAllRoles().fetch(), "name");
    if (!this.roles)
      return allRoles;
    return _.difference(allRoles, this.roles);
  }
});

Template.updateAccountModalInner.events({
  'click .add-role': function (event, template) {
    event.stopImmediatePropagation();
    var role = this.toString();
    var userId = event.currentTarget.getAttribute('data-user-id');
    Meteor.call('addUserRole', userId, role, function (error) {
      if (error) {
        // optionally use a meteor errors package
        if (typeof Errors === "undefined")
          Log.error('Error: ' + error.reason);
        else {
          Errors.throw(error.reason);
        }
      }

      //update the data in the session variable to update modal templates
      Session.set('userInScope', Meteor.users.findOne(userId));
    });
  },

  'click .remove-role': function (event, template) {
    event.stopImmediatePropagation();
    var role = this.toString();
    var userId = event.currentTarget.getAttribute('data-user-id');

    Meteor.call('removeUserRole', userId, role, function (error) {
      if (error) {
        // optionally use a meteor errors package
        if (typeof Errors === "undefined") {
          if (error.reason && error.details) {
            if (JutoCordovaBridge) {
              JutoCordovaBridge.alert(error.details, function () {
              }, error.reason, "OK");
            } else {
              alert(error.details);
            }
          }
          Log.error('Error: ' + error.reason);
        } else {
          Errors.throw(error.reason);
        }
      }

      //update the data in the session variable to update modal templates
      Session.set('userInScope', Meteor.users.findOne(userId));
    });
  },

  'click .modal-close': function (event, template) {
    event.stopImmediatePropagation();
    // build an object with our properties
    let newValuesObject = {}; // we'll build this up as we process the form.
    template.$("input").each((index, item) => {
      let propString = item.name; // "profile.contactDetails.mobilePhone"
      let propArray = propString.split("."); // ["profile","contactDetails","mobilePhone"]

      // loop through the components of the property name 'a.b.c' to create the structure { a: { b: { c: value } } }
      let objAtPropertyLevel = {};
      let topLevelObject = objAtPropertyLevel; // the top-level object retains the reference after we've reassigned objAtPropertyLevel

      if (propArray.length > 1) {
        propArray.forEach((thisPropComponent, index) => {
          // console.log(`(thisPropComponent,index,objAtPropertyLevel)=(${thisPropComponent},${index},${JSON.stringify(objAtPropertyLevel)})`);
          if (index === (propArray.length - 1)) { // this is the last one. Assign the value.
            // console.log(`value of ${thisPropComponent} = ${$(item).val()}`);
            objAtPropertyLevel[thisPropComponent] = $(item).val();
          } else {
            objAtPropertyLevel[thisPropComponent] = {};
            objAtPropertyLevel = objAtPropertyLevel[thisPropComponent]; // the reference moves deeper into the object
          }
        }, objAtPropertyLevel);
      } else {
        // no periods in path - top-level property
        topLevelObject[propString] = item.value;
      }
      newValuesObject = _.deepExtend(newValuesObject, topLevelObject);
    });

    // update our user
    Meteor.call('adminAccountsUpdateUser', Session.get("userInScope")._id, newValuesObject,
      (err, res) => {
        if (err) {
          console.error(err);
        } else {
          console.log(JSON.stringify(res));
        }
      }
    );
    Session.set("ACCOUNTS_ADMIN_SHOW_UPDATE_USER", false);
    closeMaterializeModal($('#updateaccount'));
  }
});

Template.updateAccountModalInner.onCreated(function () {
  this.subscribe("UserProfiles", Session.get("userInScope"));
});

