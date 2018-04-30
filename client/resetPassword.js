// add another event
Template.resetPasswordModalInner.events({
  'blur #arp-new-password-input': function (event, template) {
    var passwordField = template.find('#arp-new-password-input');
    if (passwordField.value === "") { //Field is invalid (blank)
      setError(passwordField, "Required Field");
    } else { //Valid input
      setSuccess(passwordField);
    }
  },
  'blur #arp-repeat-new-password-input': function (event, template) {
    var passwordField = template.find('#arp-repeat-new-password-input');
    if (passwordField.value === "") { //Field is invalid (blank)
      setError(passwordField, "Required Field");
    } else { //Valid input
      setSuccess(passwordField);
    }
  },
  'click .arp-button': function (event, template) {
    var passwordField = template.find('#arp-new-password-input');
    var repeatPasswordField = template.find('#arp-repeat-new-password-input');

    if (passwordField.value !== repeatPasswordField.value) {
      setError(passwordField,T9n.get("error.pwdsDontMatch"));
      setError(repeatPasswordField,T9n.get("error.pwdsDontMatch"));
    } else {
      setSuccess(passwordField);
      setSuccess(repeatPasswordField);
      var userInScope = Session.get("userInScope");
      Meteor.call('adminAccountsChangePasswordForUser',userInScope._id, passwordField.value);
      closeMaterializeModal($("#resetPassword"));
    }
  },
  'click .modal-close': function() {
    closeMaterializeModal($("#resetPassword"));
  }
});
