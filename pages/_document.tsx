import Document, { Html, Main, NextScript, Head } from 'next/document';
import Footer from './components/Footer';
import Header from './components/Header';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta charSet="utf-8" />
        </Head>
        <body>
          <Header />
          <Main />
          <Footer  />
          <NextScript />
        </body>
      </Html>
    );
  }
}
