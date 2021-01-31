# Vault74

![](https://ipfs.io/ipfs/QmW2Kbkx2APq8rmGDnGaMPZy4amTk4fzhrMiDq257h745J)

Decentralized chat & sharing platform


![](https://c.gitcoin.co/docs/8d49c129c59c3431b4127f521993eae2/unknown.png)


# Running Locally with Docker
- install docker
- clone repo down
- run `docker build -t vault74 .` to build the docker image
- run `docker run -p 8080:8080 -p 8081:8081 -p 443:443 vault74` to run the application. Go to localhost:8080 in your browser with Metamask installed


# Running Locally Without Docker

You must install [Node.JS](https://nodejs.org/en/download/) on your system prior to running the application. 

### Textile.io Setup
Because the application uses HMR it will refresh un-nessiarily so it is recommended to run Textile locally. 
You can use their Docker container which makes this very easy, information here: [Textile Docker](https://github.com/textileio/go-threads#running-threaddb).

Alternativley you can simply create a key for Textile and include it in your config. Creating a Textile account and generating keys is explained here: [Textile Account](https://docs.textile.io/hub/accounts/)

### Creating the config

You'll need to fill out a few things in the config, first create your config by running `cp src/config/config-example.js src/config/config.js`. 

**Next enter the following information:**

`env` - Switch to 'prod' unless you're using a local instance of Textile.

`textile.key` - Replace this with your Textile.io API key.

### Update & Install Dependancies

**Update Submodules**

`git submodule update --init --recursive`

**Install Deps.**

`yarn` or `npm install`

### Build Contracts (Currently Optional)

**Build Contracts**

Install Truffle `npm i -g truffle`

Build Contracts `cd src/contracts && truffle build`

### Running Vault

**Start in Devmode**

`yarn dev` or `npm run dev`

Navigate to `http://localhost:8080`. (This should open automatically.)

In your browser, use something like metamask connected to the goerli testnet.

## Theming

Themes can be added by adding them to the list in `src/components/main/settings/personalize`
You should clone one of the themes in `src/assets/styles/` first then add the name of the theme in `Personalize.vue`.

Example. if your theme is named `cyan.less` you'd add the following to Personalize.

```vue
<div class="select">
    <select v-model="$store.state.theme">
        <option value="dark">Simply Dark</option>
        <option value="light">Eye Strain</option>
        <option value="ice">Ice Cold</option>
        <option value="tokyo">Tokyo Night</option>
        <option value="tokyo-lights">Tokyo Lights</option>
        <!-- Your Theme! -->
        <option value="cyan">Oh So Cyan</option>
    </select>
</div>
```

In `App.vue` make sure to add your class to the bottom of the file with the same name as the vaule of your `<select>` option.

```less
.dark {
  @import "assets/styles/true_dark.less";
}
.ice {
  @import "assets/styles/ice.less";
}
.tokyo {
  @import "assets/styles/tokyo.less";
}
.tokyo-lights {
  @import "assets/styles/tokyo_lights.less";
}
/* Your Theme */
.cyan {
  @import "assets/styles/cyan.less";
}
```
Save your changes and select your theme under settings. Please do not set your theme to default before submitting a PR. Please be sure to check all aspects of the app for concistancy before uploading your theme. Please make sure to use the variables at the top of the theme as opposed to manually editing everything.

## Contributing Rules

### Single File Components
If a single file component exceeds 150 lines please split it into a three file component.

### ESLint
Please make sure your changes pass the linter before commiting code

### Documentation
Please add at least a comment to new methods so it is clear what they do.
