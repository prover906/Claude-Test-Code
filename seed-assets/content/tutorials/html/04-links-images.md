## Links

```html
<a href="https://developer.mozilla.org">MDN Web Docs</a>
<a href="/courses">All courses</a>
<a href="#contact">Jump to contact section</a>
<a href="mailto:hello@example.com">Email us</a>
```

Open in a new tab safely:

```html
<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
```

## Images

```html
<img src="images/logo.png" alt="CodeNest logo" width="200" height="60">
```

- **`alt`** describes the image for screen readers and when it fails to load. Always include it.
- Setting `width` and `height` prevents layout shift while the image loads.

## Figures with captions

```html
<figure>
  <img src="chart.png" alt="Bar chart of monthly signups">
  <figcaption>Signups grew every month this year.</figcaption>
</figure>
```
