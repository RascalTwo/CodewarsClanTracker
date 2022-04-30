import Document, { Html, Main, NextScript, Head } from 'next/document';
import Footer from '../components/Footer';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta charSet="utf-8" />
        </Head>
        <body>
          <Main />
          <Footer  />
          <NextScript />
        </body>
      </Html>
    );
  }
}
