// Compatibilidad: en algunos links aparece /publish (inglés).
// Redirigimos a /publicar.

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/publicar',
      permanent: false,
    },
  };
}

export default function PublishRedirect() {
  return null;
}
