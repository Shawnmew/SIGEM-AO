declare global {
  interface Global {
    authToken: string | null
    authUser: any
  }
  const global: Global
}

declare module 'react-native' {
  export *
}

declare module 'expo-router' {
  export *
}

declare module 'axios' {
  export * from 'axios'
}

declare module 'socket.io-client' {
  export *
}

export {}
