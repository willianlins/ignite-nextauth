import { useContext, useEffect } from "react";
import { Can } from "../components/Can";
import { AuthContext } from "../context/AuthContext";
import { api } from '../services/apiClient';
import { withSSRAuth } from '../utils/withSSRAuth';

export default function Dashboard() {
  const { user, SignOut } = useContext(AuthContext)

  useEffect(() => {
    api.get('/me').then(response => console.log(response))
      .catch(err => console.log(err));
  }, [])

  return (
    <>
      <h1>Dashboard: {user?.email}</h1>

      <button onClick={SignOut}>Sign out</button>

      <Can permissions= {['metrics.list']}>
        <div>Métricas</div>
      </Can>
    </>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  return {
    props: {}
  }
})