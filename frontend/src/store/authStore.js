// authStore.js
export const authStore = {
  token: null,
  user: null,

  setSession(session) {
    this.token = session?.access_token;
    this.user = session?.user;
  },

  logout() {
    this.token = null;
    this.user = null;
  }
};