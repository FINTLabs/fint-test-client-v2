import { NovariHeader } from "novari-frontend-components";

interface HeaderProps {
  onLogout: () => void;
}

//TODO: check what is necessary to keep in the header ie login/logout and scrolling
export function Header({ onLogout }: HeaderProps) {
  return (
    <>
      <header>
        {/* home(element) */}
        <div
          className="home"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/";
          }}
        />

        {/* logout(element) */}
        <div
          className="logout"
          onClick={(e) => {
            e.preventDefault();
            onLogout();
          }}
        />

        {/* goToTop(element) */}
        <div
          className="roundButton upButton"
          onClick={(e) => {
            e.preventDefault();
            console.log("to top");
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
          }}
        />

        {/* goToBottom(element) */}
        <div
          className="roundButton bottomButton"
          onClick={(e) => {
            e.preventDefault();
            console.log("to bottom");
            window.scrollTo(0, document.body.scrollHeight);
          }}
        />
      </header>
      <NovariHeader
        appName="Fint Test Client"
        showLogoWithTitle={true}
        menu={[]}
        isLoggedIn={true}
        displayName="Test User"
        onLogout={onLogout}
        onLogin={() => {}}
        onMenuClick={() => {}}
      />
    </>
  );
}
