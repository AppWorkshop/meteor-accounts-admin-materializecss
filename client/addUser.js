// add user modal
Template.adduserModalInner.events({
  'click .aau-button': function (event, template) {
    var elementsToBlur = [$("#aau-username-input"), $("#aau-password-input"), $("#aau-first-name-input"), $("#aau-surname-input"), $("#aau-email-input"), $("#aau-phone-input")];
    for (var i = 0; i < elementsToBlur.length; i++) { //blur all fields to prevent a blank form submission
      elementsToBlur[i].blur();
    }

    if ($('#aau-form')[0].checkValidity()) { //Form is valid
      // create a user by calling our meteor method (defined in plugin_settings.js)
      var newUserObj = {
        "username": elementsToBlur[0].val(),
        "password": elementsToBlur[1].val().toLowerCase(),
        "profile": {
          "firstname": elementsToBlur[2].val(),
          "surname": elementsToBlur[3].val(),
          "contactDetails": {
            "mobilePhone": elementsToBlur[5].val(),
            "emailAddress": elementsToBlur[4].val(),
          }
        }
      };
      if (elementsToBlur[0].val()) {
        newUserObj.profile.username = elementsToBlur[0].val();
        //newUserObj.profile.phoneNumberVerified = true;
      }

      Meteor.call("adminAccountsCreateUser", newUserObj,
        function (error) {
          if (error) {
            if (Meteor.AdminAccountsConfig && Meteor.AdminAccountsConfig.adminAccountsCreateUserErrorCallback) {
              Meteor.AdminAccountsConfig.adminAccountsCreateUserErrorCallback(error);
            } else {
              console.error(error);
            }
          } else {
            if (Meteor.AdminAccountsConfig && Meteor.AdminAccountsConfig.adminAccountsCreateUserSuccessCallback) {
              Meteor.AdminAccountsConfig.adminAccountsCreateUserSuccessCallback(newUserObj);
            } else {
              console.log( "User: " + elementsToBlur[0].val() + " created.");
            }
            closeMaterializeModal($("#adduser"));
            //Blank input values/reset validity
            for (var i = 0; i < elementsToBlur.length; i++) {
              elementsToBlur[i].val("");
              elementsToBlur[i].removeClass("valid");
              elementsToBlur[i].next().next().removeClass("active"); //OCD mode activated
            }
          }
        });
    }
  },
  'blur #aau-first-name-input': function (event, template) {
    var firstNameField = template.find('#aau-first-name-input');
    if (firstNameField.value === "") { //Field is invalid (blank)
      setError(firstNameField, "Required Field");
    } else { //Valid input
      setSuccess(firstNameField);
    }
  },
  'blur #aau-surname-input': function (event, template) {
    var surnameField = template.find('#aau-surname-input');
    if (surnameField.value === "") { //Field is invalid (blank)
      setError(surnameField, "Required Field");
    } else { //Valid input
      setSuccess(surnameField);
    }
  },
  'blur #aau-username-input': function (event, template) {
    var usernameField = template.find('#aau-username-input');
    var buttonElement = template.find('.aau-button');
    if (usernameField.value === "") { //Field is invalid (blank)
      setError(usernameField, "Required Field");
    // } else if (!usernameField.value.match(/^\d{10}$/)) { //Field is invalid (must be 10 digits)
    //   setError(usernameField, "Must be a valid 10 digit mobile number");
    } else { //Field passes initial tests, query if username is taken
      Meteor.call("userExists", usernameField.value, function (err, userExists) {
        if (!userExists) {
          setSuccess(usernameField); //Username is available
        } else {
          setError(usernameField, "Username is already taken");
        }
      });
    }
  },
  'blur #aau-password-input': function (event, template) {
    var passwordField = template.find('#aau-password-input');
    if (passwordField.value === "") { //Field is invalid (blank)
      setError(passwordField, "Required Field");
    } else { //Valid input
      setSuccess(passwordField);
    }
  },
  'blur #aau-phone-input': function (event, template) {
    var phoneField = template.find('#aau-phone-input');
    // console.log(phoneField.pattern);
    if (phoneField.value === "") { //Field is invalid (blank)
      setError(phoneField, "Required Field");
    } else if (!(new RegExp(phoneField.pattern)).test(phoneField.value)) { //Valid input
      setError(phoneField, "Invalid Number");
    } else {
      setSuccess(phoneField);
    }
  },
  'click .modal-close': function (event, template) {
    cancelButtonWasPressed();
  }
});