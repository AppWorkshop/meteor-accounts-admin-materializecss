
/**
 * When the modal cancel button is pressed - clear the create user form
 * */
cancelButtonWasPressed = function() {
  // Create arrays of the form elements + labels
  var elementsInModal = [$("#aau-username-input"), $("#aau-password-input"), $("#aau-first-name-input"), $("#aau-surname-input"), $("#aau-email-input")];
  var elementLabelsInModal = [$("#aau-username-label"), $("#aau-password-label"), $("#aau-first-name-label"),$("#aau-surname-label"), $("#aau-email-label")];

  // Loop through the elements and labels and check their classes
  for (var i = 0; i < elementsInModal.length; i++) {
    // Invalid class, remove it
    if (elementsInModal[i].hasClass("invalid")) {
      elementsInModal[i].removeClass("invalid");
    }
    // Valid class, remove it
    if (elementsInModal[i].hasClass("valid")) {
      elementsInModal[i].removeClass("valid");
    }
    // Label is active, remove it
    if (elementLabelsInModal[i].hasClass("active")) {
      elementLabelsInModal[i].removeClass("active");
    }
    // Clear the input
    elementsInModal[i].val("");
  }
  // Close the modal
  closeMaterializeModal($('#adduser'));
};

/* START FUNCTIONS */
setError = function(element, errorMessage) {
  element.classList.add("invalid");
  element.classList.remove("valid");
  element.nextElementSibling.children[1].textContent = (errorMessage);
  element.nextElementSibling.classList.remove('hidden');
};

setSuccess = function(element) {
  element.classList.add("valid");
  element.classList.remove("invalid");
  element.nextElementSibling.classList.add('hidden');
};

isNewMaterializeModalMode = false;
isMaterializeModalModeInitialized = false;

initializeMaterializeModalMode = function() {
  if (!isMaterializeModalModeInitialized) {
    isNewMaterializeModalMode = !!($(document.body).modal);
    isMaterializeModalModeInitialized = true;
  }
};

openMaterializeModal = function(jQueryElement) {
  initializeMaterializeModalMode();
  if (isNewMaterializeModalMode) {
    jQueryElement.modal('open');
  } else {
    jQueryElement.openModal();
  }
};

closeMaterializeModal = function(jQueryElement) {
  initializeMaterializeModalMode();
  if (isNewMaterializeModalMode) {
    jQueryElement.modal('close');
  } else {
    jQueryElement.closeModal();
  }
};
/* END FUNCTIONS */
