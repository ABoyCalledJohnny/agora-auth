// The Service (UserService.changeStatus(userId, newStatus)) is exactly where this logic belongs. That is where you enforce business rules, such as:

// Preventing an admin from suspending themselves.
// Throwing an error if the user is already in the requested status.
// Revoking any active DB sessions associated with that user if they are being suspended.
