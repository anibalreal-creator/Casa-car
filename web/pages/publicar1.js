export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/publicar',
      permanent: true,
    },
  };
}

export default function PublishRedirect() {
  return null;
}
