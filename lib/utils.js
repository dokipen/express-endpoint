/**
 * Find an object in a list by predicate.
 *
 * @param {Array}
 * @param {Object}
 * @return {Object}
 * @api private
 */
function find(obj, member) {
  var found = obj.filter(function(oldMember) {
    return oldMember.name == member.name;
  });

  return found.length > 0;
}

/**
 * Update parameters without overwriting any members.
 *
 * @param {Array}
 * @param {Array}
 * @return {Array}
 * @api public
 */
exports.safeUpdate = module.exports.safeUpdate = function(parameters, newMembers) {
  if (!newMembers) {
    return parameters;
  }

  newMembers.forEach(function(newMember) {
    if (!find(parameters, newMember)) {
      parameters.push(newMember);
    }
  })

  return parameters;
}
