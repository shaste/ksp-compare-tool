// See http://brunch.io for documentation.
module.exports = {
  npm: {
    enabled: true,
    styles: {
      'awesomplete': ['awesomplete.css'],
      'rangeslider.js': ['dist/rangeslider.css'],
      'normalize.css': ['normalize.css']
    }
  },
  files: {
    javascripts: {
      joinTo: {
        'vendor.js': /^(?!app)/, // Files that are not in `app` dir.
        'app.js': /^app/
      }
    },
    stylesheets: {
      joinTo: {
        'vendor.css': /^(?!app)/, // Files that are not in `app` dir.
        'app.css': /^app/
      }
    }
  },
  plugins: {
    babel: {presets: ['latest']}
  }
};

