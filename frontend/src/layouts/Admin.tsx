import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import Auth from "@aws-amplify/auth";
import { useSettings, useCurrentAuthenticatedUser } from "../hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowClose } from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import Logo from "../components/Logo";
import Alert from "../components/Alert";
import EnvConfig from "../services/EnvConfig";

interface LayoutProps {
  children: ReactNode;
}

function AdminLayout(props: LayoutProps) {
  const {
    username,
    isAdmin,
    isFederatedId,
    isEditor,
  } = useCurrentAuthenticatedUser();
  const { settings } = useSettings();

  const signOut = async (event: React.MouseEvent) => {
    try {
      if (isFederatedId) {
        event.preventDefault();
      }
      await Auth.signOut();
    } catch (error) {
      console.log("error signing out: ", error);
      event.preventDefault();
    }
  };

  return (
    <>
      <div className="usa-overlay"></div>
      <header className="usa-header usa-header--basic">
        <div className="usa-nav-container">
          <div className="usa-navbar navbar-long">
            <div className="usa-logo margin-top-2" id="basic-logo">
              <em className="usa-logo__text display-flex flex-align-center">
                <div className="logo">
                  <Logo />
                </div>

                <Link to="/admin" title="Home" aria-label="Home" className="">
                  {settings.navbarTitle}
                </Link>
              </em>
            </div>
            <button className="usa-menu-btn">Menu</button>
          </div>
          <nav aria-label="Primary navigation" className="usa-nav">
            <button className="usa-nav__close">
              <FontAwesomeIcon icon={faWindowClose} size="lg" role="img" />
            </button>
            <ul className="usa-nav__primary usa-accordion">
              {isAdmin || isEditor ? (
                <>
                  <li className="usa-nav__primary-item">
                    <Link className="usa-nav__link" to="/admin/dashboards">
                      Dashboards
                    </Link>
                  </li>
                </>
              ) : (
                ""
              )}
              {isAdmin ? (
                <>
                  <li className="usa-nav__primary-item">
                    <Link className="usa-nav__link" to="/admin/users">
                      Manage users
                    </Link>
                  </li>
                  <li className="usa-nav__primary-item">
                    <Link className="usa-nav__link" to="/admin/settings">
                      Settings
                    </Link>
                  </li>
                </>
              ) : (
                ""
              )}
              <li className="usa-nav__primary-item">
                <button
                  className="usa-accordion__button usa-nav__link"
                  aria-expanded="false"
                  aria-controls="basic-nav-section-one"
                >
                  <span>{username}</span>
                </button>
                <ul
                  id="basic-nav-section-one"
                  className="usa-nav__submenu"
                  hidden
                >
                  <li className="usa-nav__submenu-item">
                    <a href="/admin" onClick={signOut} className="usa-link">
                      Logout
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="padding-y-3">
        {isAdmin || isEditor ? (
          <>
            <div className="grid-container">{props.children}</div>
          </>
        ) : (
          <>
            <div className="text-center margin-top-5 grid-container">
              <Alert
                type="warning"
                hideIcon
                slim
                message={
                  <div>
                    You haven't been granted access. You can{" "}
                    <a
                      href={`mailto:${EnvConfig.contactEmail}?subject=Performance Dashboard Assistance - Request Access`}
                      className="text-base"
                    >
                      contact support
                    </a>{" "}
                    to request the Editor or Admin role or view{" "}
                    <a href="/" className="text-base">
                      published dashboards
                    </a>
                  </div>
                }
              ></Alert>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export const withAdminLayout = (
  component: React.ComponentType
): React.FunctionComponent<{}> => {
  return function () {
    return <AdminLayout>{React.createElement(component)}</AdminLayout>;
  };
};

export default withAdminLayout;
