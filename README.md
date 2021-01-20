# Vault74

![](https://ipfs.io/ipfs/QmW2Kbkx2APq8rmGDnGaMPZy4amTk4fzhrMiDq257h745J)

Decentralized chat & sharing platform


![](https://c.gitcoin.co/docs/8d49c129c59c3431b4127f521993eae2/unknown.png)

## Running Locally

You must install [Node.JS](https://nodejs.org/en/download/) on your system prior to running the application.

**Update Submodules**
`npm run init` or `yarn run init`

**Install Deps.**
`yarn` or `npm install`

**Build Contracts**
Install Truffle `npm i -g truffle` or `yarn global add truffle`
Build Contracts `npm run truffle` or `yarn truffle`

**Start in Devmode**
`yarn dev` or `npm run dev`

Navigate to `http://localhost:8080`.

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
