exports.isFriend = (requestingUser, owner) => {
  return  recipeMaster.isFriendsOnly
          && owner.friendsList.some(friend => friend.equals(requestingUser));
}

exports.isUserAuthedForRecipe = (requestingUser, owner, recipeMaster) => {
  return  recipeMaster.isPublic || isFriend(requestingUser, owner);
};
