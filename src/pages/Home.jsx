import styles from './Home.module.css';

export const Home = () => {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Home</h1>
      <p className={styles.lead}>
        Welcome to the app. Edit src/pages/Home.jsx to get started.
      </p>
    </section>
  );
};
