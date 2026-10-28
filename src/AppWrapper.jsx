import { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import toast from "react-hot-toast";
import { buildSsoSession, clearSsoPending, hasSsoPending, tokenRequest } from "./config/authConfig.jsx";
import { setCredentials } from "./Components/redux/features/auth.jsx";

export default function AppWrapper() {
  const { instance, inProgress, accounts } = useMsal();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const processing = useRef(false);

  useEffect(() => {
    if (inProgress !== InteractionStatus.None || processing.current || !hasSsoPending()) return;

    if (isAuthenticated) {
      clearSsoPending();
      return;
    }

    const account = instance.getActiveAccount() || accounts[0];

    if (!account) {
      clearSsoPending();
      toast.error("Microsoft sign-in was cancelled or didn't complete. Try again.");
      return;
    }

    processing.current = true;
    instance.setActiveAccount(account);

    instance
      .acquireTokenSilent({ ...tokenRequest, account })
      .then((result) => {
        const session = buildSsoSession(result);
        dispatch(setCredentials(session));
        toast.success(`Welcome, ${session.user.firstName}. Signed in with Microsoft.`);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        toast.error("We couldn't complete Microsoft sign-in. Try again.");
      })
      .finally(() => {
        clearSsoPending();
        processing.current = false;
      });
  }, [inProgress, accounts, instance, isAuthenticated, dispatch, navigate]);

  return <Outlet />;
}
