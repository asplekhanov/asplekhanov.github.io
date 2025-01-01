import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from './types/config'
import { LinkPreset } from './types/config'

export const siteConfig: SiteConfig = {
  title: 'DEVmemo.RU',
  subtitle: 'личный архив знаний и опыта',
  lang: 'ru',         // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko'
  themeColor: {
    hue: 225,         // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
    fixed: false,     // Hide the theme color picker for visitors
  },
  banner: {
    enable: true,
    src: 'assets/images/1-banner.png',   // Relative to the /src directory. Relative to the /public directory if it starts with '/'
    position: 'center',      // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
    credit: {
      enable: true,         // Display the credit text of the banner image
      text: 'Credit',              // Credit text to be displayed
      url: 'https://www.wallpaperflare.com/person-standing-on-ledge-illustration-game-digital-wallpaper-wallpaper-tbv'                // (Optional) URL link to the original artwork or artist's page
    }
  },
  toc: {
    enable: true,           // Display the table of contents on the right side of the post
    depth: 3                // Maximum heading depth to show in the table, from 1 to 3
  },
  favicon: [    // Leave this array empty to use the default favicon
    //{
      //src: '/favicon/favicon-dark-192.png',    // Path of the favicon, relative to the /public directory
      //theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
      //sizes: '128x128',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
    //}
  ]
}

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.Projects,
    {
      name: 'Dzen',
      url: 'https://dzen.ru/devmemo',     // Internal links should not include the base path, as it is automatically added
      external: true,                               // Show an external link icon and will open in a new tab
    },
    {
      name: 'GitHub',
      url: 'https://github.com/asplekhanov',     // Internal links should not include the base path, as it is automatically added
      external: true,                               // Show an external link icon and will open in a new tab
    },
  ],
}

export const profileConfig: ProfileConfig = {
  avatar: 'assets/images/demo-avatar.png',  // Relative to the /src directory. Relative to the /public directory if it starts with '/'
  name: 'Артём Плеханов',
  bio: 'Full Stack Developer',
  links: [
    {
      name: 'Dzen',
      icon: 'fa6-brands:yandex',
      url: 'https://dzen.ru/devmemo',
    },
    {
      name: 'GitHub',
      icon: 'fa6-brands:github',
      url: 'https://github.com/asplekhanov',
    },
    {
      name: 'CodePen',
      icon: 'fa6-brands:codepen',
      url: 'https://codepen.io/asplekhanov',
    },
  ],
}

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: 'CC BY-NC-SA 4.0',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
}
