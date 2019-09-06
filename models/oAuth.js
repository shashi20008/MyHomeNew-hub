const mongoose = require('mongoose');
const {
  Schema
} = mongoose;
const UserModel = require('./users');
const _cloneDeep = require('lodash/cloneDeep');

/**
 * Auth codes.
 */
const OAuthCodesModel = mongoose.model('OAuthCodes', new Schema({
  code: String,
  expiresAt: Date,
  redirectUri: String,
  client: String, // id from clients model
  user: String // id from users model
}));

function saveAuthorizationCode(code, client, user) {
  const { authorizationCode, expiresAt, redirectUri } = code;
  const authCodeDoc = new OAuthCodesModel({
    code: authorizationCode,
    expiresAt,
    redirectUri,
    client: client.id,
    user: user.email
  });
  return authCodeDoc.save()
    .then(authCode => {
      const resp = _cloneDeep(authCode.toJSON());
      return Object.assign(resp, {authorizationCode}, {client}, {user});
    })
}

function getAuthorizationCode(authorizationCode) {
  return OAuthCodesModel.findOne({code: authorizationCode})
    .then(authCode => {
      if(!authCode) {
        throw new Error('AUTH_CODE_NOT_FOUND');
      }

      return Promise.all([
        authCode,
        getClient(authCode.client),
        UserModel.find({email: authCode.user}).then(i=>i)
      ]);
    })
    .then(([authCode, client, user]) => Object.assign(
      authCode.toJSON(),
      {client},
      {user}
    ));
}

function revokeAuthorizationCode(code) {
  return new Promise(resolve => OAuthCodesModel.remove({code: code.code}, (err) => {
    resolve(!err);
  }))
}

/**
 * Clients
 */
const OAuthClientsModel = mongoose.model('OauthClients', new Schema({
  id: String,
  secret: String,
  redirectUris: [String],
  grants: [String]
}));

function createClient(clientObj) {
  return (new OAuthClientsModel(clientObj)).save().then(client => client);
}

function getClient(id, secret) {
  console.log('finding client!!', id, secret);
  return OAuthClientsModel.findOne(Object.assign({id}, secret && {secret})).lean();
}

/**
 * Tokens
 */
const OAuthTokensModel = mongoose.model('OauthTokens', new Schema({
  accessToken: String,
  accessTokenExpiresAt: Date,
  refreshToken: String,
  refreshTokenExpiresAt: Date,
  client: String, // client id from clients model
  user: String // id from users model
}));

function saveToken(token, client, user) {
  const tokenDoc = new OAuthTokensModel({
    ...token,
    client: client.id,
    user: user.email
  });

  return tokenDoc.save()
    .then(token => {
      const resp = _cloneDeep(token.toJSON());
      return Object.assign(resp, {client}, {user});
    })
}

function getAccessToken (bearerToken) {
  return OAuthTokensModel.findOne({
    accessToken: bearerToken
  })
    .then(token => Promise.all([
      token,
      getClient(token.client),
      UserModel.find({email: token.user}).then(i=>i)
    ]))
    .then(([token, client, user]) => Object.assign(
      token.toJSON(),
      {client},
      {user}
    ));
};

function revokeToken(token) {
  return new Promise(resolve => OAuthTokensModel.remove({
    refreshToken: token.refreshToken
  }, err => {
    resolve(!err);
  }));
}

function getRefreshToken(refreshToken) {
  return OAuthTokensModel.findOne({
    refreshToken
  })
    .then(token => Promise.all([
      token,
      getClient(token.client),
      UserModel.find({email: token.user}).then(i=>i)
    ]))
    .then(([token, client, user]) => Object.assign(
      token.toJSON(),
      {client},
      {user}
    ));
}

module.exports = {
  saveAuthorizationCode,
  getAuthorizationCode,
  revokeAuthorizationCode,
  getClient,
  saveToken,
  getAccessToken,
  getRefreshToken,
  revokeToken
};