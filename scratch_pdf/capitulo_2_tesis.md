# CAPÍTULO II
# MARCO TEÓRICO DE LA INVESTIGACIÓN (FUNDAMENTACIÓN CONCEPTUAL)

El presente capítulo desarrolla la fundamentación teórica y conceptual que sustenta la presente investigación. Se organiza en tres grandes secciones: en primer lugar, se describen los antecedentes históricos de la administración de centros deportivos y el impacto de la digitalización; en segundo lugar, se exponen los antecedentes investigativos, analizando trabajos previos relacionados con el desarrollo de sistemas para gimnasios; y, finalmente, se desarrolla la fundamentación conceptual detallando las tecnologías, arquitecturas, metodologías y conceptos de negocio que dan viabilidad al proyecto GimApp para el gimnasio Gigafit.

## 2.1 Antecedentes Históricos

### 2.1.1 Evolución de la Administración en Centros Deportivos
Históricamente, los gimnasios y clubes de salud surgieron como espacios dedicados exclusivamente al entrenamiento físico y al levantamiento de pesas. En sus inicios, durante las décadas de 1970 y 1980, la administración de estos espacios se realizaba de manera completamente empírica y manual. Los propietarios, usualmente ex atletas o entusiastas del deporte, gestionaban a sus clientes mediante cuadernos de registro, fichas físicas y cobros exclusivos en efectivo. No existía la concepción del gimnasio como un modelo de negocio escalable, sino como un servicio de nicho (Universidad Politécnica Salesiana [UPS], 2023).

A medida que el *fitness* comenzó a popularizarse globalmente en la década de 1990, impulsado por tendencias de bienestar y salud preventiva, la cantidad de usuarios aumentó de forma exponencial (Research and Markets, 2024). Esto obligó a los centros a adoptar las primeras herramientas ofimáticas, como hojas de cálculo, para llevar un control rudimentario de los pagos y las fechas de vencimiento de las membresías. Sin embargo, este modelo de gestión presentaba altas tasas de error humano, pérdida de información y una nula capacidad para retener datos históricos del cliente, lo que dificultaba las estrategias de fidelización (Mercado Fitness, 2023).

### 2.1.2 La Transformación Digital en el Sector Fitness
El verdadero cambio de paradigma ocurrió en la primera década del siglo XXI con la introducción del software de gestión (CRM - *Customer Relationship Management*) adaptado a la industria del *fitness*. Las grandes cadenas internacionales fueron las pioneras en adoptar sistemas informáticos que automatizaban el control de acceso mediante tarjetas magnéticas o biometría, así como la gestión de pagos recurrentes (Mordor Intelligence, 2024). 

En América Latina, esta modernización llegó de forma desigual. Mientras que las franquicias internacionales introdujeron tecnología de punta, los gimnasios independientes mantuvieron prácticas tradicionales. Según el Banco Interamericano de Desarrollo (BID, 2022), las micro, pequeñas y medianas empresas (mipymes) en la región enfrentan barreras estructurales y económicas para la adopción tecnológica, lo que genera una brecha competitiva significativa frente a las grandes corporaciones.

La pandemia de COVID-19 en 2020 actuó como un catalizador obligatorio para la digitalización. Los cierres temporales obligaron a los gimnasios a buscar alternativas para mantener contacto con sus clientes, organizar reservas de aforo y, fundamentalmente, procesar pagos sin contacto (Comisión Económica para América Latina y el Caribe [CEPAL], 2021). Tras la pandemia, el consumidor latinoamericano cambió sus hábitos: la Health & Fitness Association (HFA & ABC Fitness, 2024) documenta que existe una alta adopción de canales digitales, y los usuarios esperan que sus centros de entrenamiento ofrezcan aplicaciones para gestionar sus rutinas, pagos y membresías desde sus dispositivos móviles.

---

## 2.2 Antecedentes de Investigaciones Relacionadas

El desarrollo de aplicaciones móviles y sistemas web para la gestión de gimnasios ha sido un tema recurrente en la investigación académica en los últimos cinco años, respondiendo a la necesidad de modernizar las mipymes del sector. A continuación, se detallan cinco enfoques de investigación relevantes que sirven como base y referencia para este proyecto:

**1. Desarrollo de Aplicaciones Móviles para Control de Acceso (2022)**
Diversos trabajos académicos, como los analizados en el repositorio de la Universidad Politécnica Salesiana (UPS, 2023), se han centrado en eliminar el uso de credenciales plásticas utilizando aplicaciones nativas. Los estudios concluyen que la mayoría de los usuarios prefiere el uso del smartphone para acceder al recinto deportivo. Esto demuestra la alta viabilidad y aceptación de las credenciales digitales, concepto que GimApp adopta para el control de identidad de los socios.

**2. Sistemas Cliente-Servidor para Gestión Administrativa (2021)**
Las investigaciones sobre arquitecturas web para centros deportivos demuestran que el uso de lenguajes como PHP para el backend resuelve efectivamente el problema de la pérdida de información de pagos mediante módulos de carga de comprobantes, validados posteriormente por la administración (Laravel, 2024). Esto aborda directamente una de las problemáticas centrales en Gigafit: la dependencia de transferencias validadas por redes sociales.

**3. Impacto de la Usabilidad en Mipymes (2023)**
El estudio de Vilela-Celorio y Sánchez-Pico (2023) evaluó cómo una interfaz poco intuitiva genera altas tasas de desinstalación en aplicaciones de servicios. Los autores recomendaron fuertemente la aplicación de la norma ISO 9241-11 (ISO, 2018) para medir la usabilidad. Esta evidencia fundamenta la elección de la metodología de Diseño Centrado en el Usuario (DCU) para GimApp.

**4. Arquitectura de Software para Sistemas de Inventarios (2022)**
Estudios técnicos que comparan arquitecturas de software concluyen que, para negocios de tamaño medio y recursos limitados de infraestructura, una API RESTful monolítica bien estructurada ofrece el mejor equilibrio entre rendimiento y mantenibilidad (Fielding, 2000; Laravel, 2024). Esto justifica técnica y económicamente la decisión de utilizar Laravel como núcleo central del servidor para Gigafit.

**5. Competitividad y Comercio Electrónico (2024)**
Informes del sector, como los publicados por Primicias (2024) y Mordor Intelligence (2024), identifican que la proliferación de franquicias altamente tecnificadas está desplazando a los gimnasios de barrio que no ofrecen canales de pago digital ni e-commerce para sus productos. Esto proporciona el sustento comercial para la integración de un módulo de venta de productos deportivos dentro de GimApp.

---

## 2.3 Fundamentación Teórica y Definiciones Conceptuales

Para la construcción del sistema integral GimApp, es necesario definir las tecnologías, arquitecturas de software, metodologías de diseño y conceptos de negocio que intervienen en el desarrollo. Todo desarrollo tecnológico requiere de una base teórica que valide la selección de sus herramientas (Vilela-Celorio & Sánchez-Pico, 2023).

### 2.3.1 Aplicación Móvil

Una aplicación móvil es un programa informático diseñado específicamente para ejecutarse en dispositivos móviles, como teléfonos inteligentes y tabletas. A diferencia de las plataformas de escritorio, estas aplicaciones están optimizadas para operar bajo restricciones de batería y aprovechar sensores de hardware táctil (Vilela-Celorio & Sánchez-Pico, 2023). En la ingeniería de software moderna, existen tres enfoques principales:

*   **Aplicaciones Nativas:** Desarrolladas utilizando lenguajes oficiales (Swift para iOS, Kotlin/Java para Android). Presentan el mejor rendimiento, pero implican el mantenimiento de dos bases de código distintas (Meta, 2024a).
*   **Aplicaciones Híbridas:** Consisten en aplicaciones web (HTML/JS) ejecutadas dentro de un contenedor nativo (WebView). Reducen costos de desarrollo, pero suelen sacrificar rendimiento en interfaces gráficas complejas (Meta, 2024a).
*   **Aplicaciones Multiplataforma (Cross-Platform):** Permiten escribir el código una sola vez y, mediante un motor de renderizado, lo traducen a componentes nativos en tiempo real. Esto resulta en aplicaciones con rendimiento casi nativo utilizando una sola base de código (Meta, 2024a).

Para GimApp, se ha seleccionado el enfoque Multiplataforma, garantizando eficiencia en tiempos de desarrollo y equidad funcional para usuarios de Android e iOS.

### 2.3.2 Tecnologías y Herramientas Frontend

El Frontend hace referencia a la interfaz gráfica y a la capa de interacción que opera el usuario.

#### React Native
React Native es un framework de código abierto creado por Meta que permite desarrollar aplicaciones móviles multiplataforma utilizando JavaScript y la biblioteca React (Meta, 2024a). Su característica principal es que no utiliza un WebView; invoca componentes nativos de la interfaz de usuario a través de un puente de comunicación asíncrona (*Bridge*). Según la documentación técnica de Meta (2024a), esto permite que la aplicación mantenga animaciones fluidas y un rendimiento óptimo.

#### Expo
Expo es un marco de trabajo construido alrededor de React Native que simplifica el desarrollo, compilación y despliegue de las aplicaciones (Expo, 2024). Proporciona un entorno administrado (*Managed Workflow*) con bibliotecas preconfiguradas para acceso al hardware del dispositivo, permitiendo además realizar actualizaciones inalámbricas de código sin necesidad de enviar nuevas versiones a las tiendas de aplicaciones (Expo, 2024).

#### React JS
React es una biblioteca de JavaScript enfocada en la construcción de interfaces de usuario interactivas basadas en componentes encapsulados (Meta, 2024b). Su uso del "Virtual DOM" optimiza el rendimiento al renderizar en el navegador únicamente los elementos que han cambiado de estado (Meta, 2024b). Esta herramienta es la base estructural del panel de administración web de GimApp.

#### Vite
Vite es una herramienta de construcción Frontend diseñada para ofrecer tiempos de inicio y recarga extremadamente rápidos durante el desarrollo (Vite, 2024). Al aprovechar los módulos ES nativos del navegador, Vite supera las limitaciones de velocidad de herramientas anteriores como Webpack, siendo el empaquetador ideal para el panel web en React (Vite, 2024).

### 2.3.3 Tecnologías Backend y Servidor

El Backend es la capa lógica del sistema encargada de procesar las reglas de negocio, validar la seguridad e interactuar con la base de datos.

#### Arquitectura Cliente-Servidor y API RESTful
La arquitectura Cliente-Servidor divide las cargas de trabajo entre el proveedor de recursos (servidor) y los consumidores (clientes). Para conectar las aplicaciones, GimApp utiliza una API RESTful. El concepto REST (*Representational State Transfer*) fue formalizado por Roy Fielding (2000) como un estilo arquitectónico que utiliza el protocolo HTTP (métodos GET, POST, PUT, DELETE) para operar sobre recursos. Esto permite que múltiples clientes consuman la misma lógica centralizada (Fielding, 2000).

#### PHP y el Framework Laravel 12
PHP sigue siendo uno de los lenguajes predominantes en servidores backend debido a su madurez y excelente integración con bases de datos relacionales (Laravel, 2024). Laravel, construido sobre PHP, es un framework que facilita tareas complejas como el enrutamiento, autenticación y seguridad contra ataques web (Laravel, 2024). En su versión 12, Laravel incorpora herramientas avanzadas para la gestión de API, por lo que actúa como el núcleo central de procesamiento de GimApp.

#### Patrón Modelo-Vista-Controlador (MVC)
El patrón MVC es un estándar de diseño de software que separa los datos (Modelo), la interfaz de usuario (Vista) y la lógica de control (Controlador) (Laravel, 2024). En Laravel, el Modelo interactúa con la base de datos mediante un ORM (Mapeo Objeto-Relacional), el Controlador gestiona las peticiones HTTP, y la Vista (en el caso de una API) retorna respuestas en formato JSON. Esta separación asegura un código modular y de fácil mantenimiento (Laravel, 2024).

### 2.3.4 Bases de Datos Relacionales

#### MySQL
MySQL es un Sistema de Gestión de Bases de Datos Relacionales (RDBMS) que organiza la información en tablas estructuradas conectadas por claves lógicas (MySQL, 2024). Es el estándar de almacenamiento de la industria para aplicaciones web basadas en PHP, proporcionando alta disponibilidad y rendimiento en la consulta de datos (MySQL, 2024).

#### Propiedades ACID y Transacciones
Para garantizar la integridad financiera (como el registro de pagos de membresías), MySQL y su motor InnoDB operan bajo las propiedades transaccionales ACID (MySQL, 2024):
*   **Atomicidad:** Las operaciones de una transacción se ejecutan por completo o no se ejecutan en absoluto.
*   **Consistencia:** La base de datos siempre transita entre estados válidos, respetando reglas y restricciones.
*   **Aislamiento:** Múltiples transacciones simultáneas no interfieren entre sí.
*   **Durabilidad:** Los cambios confirmados son permanentes incluso ante fallos del sistema (MySQL, 2024).

### 2.3.5 Metodologías de Diseño y Desarrollo

#### Diseño Centrado en el Usuario (DCU - ISO 9241-210)
El Diseño Centrado en el Usuario es un proceso iterativo estandarizado por la norma ISO 9241-210:2019 (ISO, 2019). Esta normativa establece que los sistemas interactivos deben diseñarse basándose en una comprensión explícita de los usuarios, sus tareas y su entorno. Como señala Norman (2013), el software debe adaptarse a las capacidades cognitivas humanas, no a la inversa. La aplicación de esta norma en GimApp garantiza que las interfaces respondan a las necesidades reales del personal y de los clientes del gimnasio.

#### Usabilidad (UX/UI - ISO 9241-11)
La norma ISO 9241-11:2018 (ISO, 2018) define la usabilidad como la medida en que un producto puede ser utilizado por usuarios específicos para alcanzar objetivos con eficacia, eficiencia y satisfacción.
*   **Eficacia:** Precisión al completar tareas.
*   **Eficiencia:** Esfuerzo y tiempo invertido en lograr los objetivos.
*   **Satisfacción:** Grado de confort y actitud positiva del usuario frente al sistema (ISO, 2018).

### 2.3.6 Modelos de Negocio y Gestión Tecnológica

#### Gestión de Membresías en Clubes Deportivos
Una membresía es un modelo de negocio de ingresos recurrentes donde el cliente paga por el derecho temporal a un servicio (Mordor Intelligence, 2024). Mercado Fitness (2023) advierte que la gestión manual de estas membresías es una causa principal de pérdida de rentabilidad en gimnasios independientes debido al acceso de clientes en estado de morosidad. La digitalización permite automatizar alertas de vencimiento y bloquear accesos de forma lógica (Mercado Fitness, 2023).

#### Pagos Digitales y Comercio Electrónico
Según estadísticas del Banco Central del Ecuador (BCE, 2023) y la Asociación de Bancos Privados (Asobanca, 2022), las transferencias electrónicas se han consolidado como el método de pago cotidiano preferido por los ecuatorianos, reduciendo el uso del efectivo. Esta tendencia impulsa la necesidad de integrar validaciones de transferencias bancarias y comprobantes digitales directamente en las plataformas de servicio, facilitando el comercio electrónico a escala local (Asobanca, 2022; BCE, 2023).

---

## 2.4 Conclusiones del Marco Teórico

La revisión de la literatura histórica, los antecedentes investigativos y las bases tecnológicas permite concluir que la modernización de los procesos administrativos en los gimnasios locales es una necesidad ineludible frente a las expectativas del consumidor actual (HFA & ABC Fitness, 2024). La integración de tecnologías como React Native y Laravel (Meta, 2024a; Laravel, 2024) proporciona una base técnica robusta y económicamente viable. Asimismo, la adopción del enfoque metodológico de Diseño Centrado en el Usuario bajo normativas internacionales (ISO, 2018; ISO, 2019) asegura que el sistema GimApp será funcionalmente correcto y altamente usable.

---

## Referencias Bibliográficas

Asobanca [Asociación de Bancos Privados del Ecuador]. (2022). *La era de la banca digital en Ecuador: Adopción y evolución de los canales financieros.* Asobanca. Recuperado de https://www.asobanca.org.ec

Banco Central del Ecuador [BCE]. (2023). *Evolución y Estadísticas del Sistema de Pagos Interbancarios (SPI) 2022-2023.* BCE. Recuperado de https://www.bce.fin.ec

Banco Interamericano de Desarrollo [BID]. (2022). *The 360° on digital transformation in firms in Latin America and the Caribbean* (IDB Monograph 1067). Recuperado de https://publications.iadb.org/en/360-digital-transformation-firms-latin-america-and-caribbean

Comisión Económica para América Latina y el Caribe [CEPAL]. (2021). *Transformación digital de las mipymes: elementos para el diseño de políticas.* Naciones Unidas. Recuperado de https://repositorio.cepal.org/handle/11362/47309

Expo. (2024). *Expo Framework Documentation: The best way to build apps with React Native.* Recuperado de https://docs.expo.dev/

Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures.* (Disertación doctoral). University of California, Irvine. Recuperado de https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm

Health & Fitness Association [HFA] & ABC Fitness. (2024). *Latin Americans embrace fitness facilities as key to an active lifestyle* [Comunicado de prensa]. GlobeNewswire. Recuperado de https://www.globenewswire.com/news-release/2024/12/04/2991146/0/en/Latin-Americans-Embrace-Fitness-Facilities-as-Key-to-an-Active-Lifestyle.html

International Organization for Standardization [ISO]. (2018). *ISO 9241-11:2018. Ergonomics of human-system interaction — Part 11: Usability: Definitions and concepts.* Recuperado de https://www.iso.org/standard/63500.html

International Organization for Standardization [ISO]. (2019). *ISO 9241-210:2019. Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems.* Recuperado de https://www.iso.org/standard/77520.html

Laravel. (2024). *Laravel Documentation: The PHP Framework for Web Artisans.* Recuperado de https://laravel.com/docs

Mercado Fitness. (2023). *El 70% de los gimnasios aún no usa tecnología para gestionar su negocio.* Recuperado de https://www.mercadofitness.com/gestion/

Meta. (2024a). *React Native: Learn once, write anywhere.* Recuperado de https://reactnative.dev/

Meta. (2024b). *React: The library for web and native user interfaces.* Recuperado de https://react.dev/

Mordor Intelligence. (2024). *South America health and fitness club market — share analysis, industry trends & statistics, growth forecasts 2019–2029.* Recuperado de https://www.mordorintelligence.com/industry-reports/south-america-health-and-fitness-club-market

MySQL [Oracle]. (2024). *MySQL 8.4 Reference Manual - InnoDB and ACID Model.* Recuperado de https://dev.mysql.com/doc/

Norman, D. A. (2013). *The design of everyday things* (Edición revisada y ampliada). Basic Books. Recuperado de https://www.basicbooks.com/titles/don-norman/the-design-of-everyday-things/9780465050659/

Primicias. (2024). *¿Quién es el más 'tuco' en el mercado del fitness? Los gimnasios están en auge en Ecuador.* Recuperado de https://www.primicias.ec/economia/fitness-gimnasios-ecuador-negocio-crecimiento/

Research and Markets. (2024). *South America health and fitness club market size & share analysis — growth trends & forecasts (2024–2029).* Recuperado de https://www.researchandmarkets.com/reports/5665779/south-america-health-and-fitness-club-market

Universidad Politécnica Salesiana [UPS]. (2023). *Análisis del sector fitness y bienestar en Ecuador.* Repositorio Institucional UPS. Recuperado de https://dspace.ups.edu.ec

Vilela-Celorio, J. D., & Sánchez-Pico, J. L. (2023). *Tecnología educativa y aplicaciones móviles.* Revista Científica PROciencias. Recuperado de https://www.revistaprociencias.com

Vite. (2024). *Vite: Next Generation Frontend Tooling.* Recuperado de https://vitejs.dev/
