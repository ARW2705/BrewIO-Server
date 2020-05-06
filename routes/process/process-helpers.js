const isFriend = (requestingUser, owner, recipeMaster) => {
  return  recipeMaster.isFriendsOnly
          && owner.friendsList.some(friend => friend.equals(requestingUser));
};

const isOwner = (requestingUser, owner) => {
  return requestingUser === owner;
}

exports.isUserAuthedForRecipe = (requestingUser, owner, recipeMaster) => {
  return  recipeMaster.isPublic
          || isOwner(requestingUser, owner)
          || isFriend(requestingUser, owner, recipeMaster);
};
