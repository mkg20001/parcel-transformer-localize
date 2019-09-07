# parcel-transformer-localize

Localize your static pages, quick and simple

# Usage

Add parcel-transformer-localize as a transformer for parcel by adding this to your package.json

```json
{
  "parcel": {
    "transforms": {
      "*.html": [
        "parcel-transformer-localize"
      ]
    }
  }
}
```

# What it does

Basically it takes HTML snippets like these

```html
<translate>
  <p>Hello <b>World</b></p>
</translate>
```

Converts them into translateable strings like those `Hello %1World%2`

And creates a translation file at the specified path

# Creating translation files

Translation files are created automatically

In order to add a new language, simply add an empty file named `LANGUAGE.json`, it will be filled automatically
