// See http://brunch.io for documentation.
module.exports = {
  npm: {
    enabled: true,
    styles: {
      'rangeslider.js': ['dist/rangeslider.css'],
      'normalize.css': ['normalize.css'],
      '@yaireo/tagify': ['/dist/tagify.css']
    }
  },
  files: {
    javascripts: {
      joinTo: {
        'vendor.js': /^(?!app)/, // Files that are not in `app` dir.
        'app.js': /^app/
      }
    },
    stylesheets: {joinTo: 'app.css'}
  },
  plugins: {
    babel: {presets: ['latest']}
  },
  server: {
    hostname: '0.0.0.0',
  }
};

