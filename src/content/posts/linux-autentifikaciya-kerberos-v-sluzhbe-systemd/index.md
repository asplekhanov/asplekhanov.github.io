---
title: "Linux: Аутентификация Kerberos в службе systemd"
published: 2025-01-01
description: "В этом материале будет рассмотрено, как реализовать аутентификацию Kerberos в службе systemd на примере приложения ASP.NET Core. Мы воспользуемся systemd, чтобы интегрировать наше приложение с операционной системой. Для реализации автоматической аутентификации Kerberos воспользуемся expect скриптом."
image: "cover.png"
tags: ["linux", "systemctl", "systemd", "kerberos", "asp.net", "asp", "core", "инструкция"]
category: Linux
draft: false
---

> Источник изображения обложки: [Source](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7RAf6MAl-aPBXx48U2uGB2HmtM5jyEuWUwBJamE53nm2TloupOZ929bVEiEFC_FliuWjPQw4S7UFaBXQedcN_6ji_zLNfNi0k99zA9WH2-iV7ZkR00GNkK2kS00GvlP_ak8dWCnoPIOfK/s655/Kerberos.png)

:::IMPORTANT[Примечание]
Материал данной статьи является ответом на вопрос:
[Ошибка подключения к MSSQL при запуске приложения .net5 как сервиса Linux - ru.stackoverflow.com](https://ru.stackoverflow.com/questions/1595262/Ошибка-подключения-к-mssql-при-запуске-приложения-net5-как-сервиса-linux)
:::

В этом материале будет рассмотрено, как реализовать аутентификацию Kerberos в службе systemd на примере приложения ASP.NET Core.

Мы воспользуемся systemd, чтобы интегрировать наше приложение с операционной системой. Для реализации автоматической аутентификации Kerberos воспользуемся expect скриптом.


## Предварительные требования
Материал подготовлен на базе следующей конфигурации:
- WEB-сервер: 
    - Astra Linux 1.7.5
    - dotnet пакет:
    - ASP.NET ([Kestrel](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/?view=aspnetcore-9.0&tabs=linux#kestrel)) приложение которое подключается к SQL Server
- SQL Server 2019


## Запуск ASP.NET приложения как службу в systemd
Перед созданием службы в systemd расположим наше приложение по удобному для вас пути, я буду располагать его в `/var/www/html/net-app`.
:::TIP[Советую изучить]
[Управление службами Linux - Losst](https://losst.pro/upravlenie-sluzhbami-linux)
:::

Теперь можно перейти к созданию и настройке service:
1. Создадим файл `net-app.service` в каталоге `/etc/systemd/system/`:
```bash
nano /etc/systemd/system/net-app.service
```
2. Задаем следующие настройки:
```bash
[Unit]
Description=ASP.NET Web Application

[Service]
Type=simple
WorkingDirectory=/var/www/html/net-app
ExecStart=/usr/bin/dotnet /var/www/html/net-app/NET.WP.dll
Restart=always
RestartSec=10
SyslogIdentifier=NET_APP
User=www-data
Group=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_NOLOGO=true

[Install]
WantedBy=multi-user.target
```
3. Запускаем службу:
```bash
sudo systemctl start net-app.service
```
4. Проверяем состояние службы:
```bash
sudo systemctl status net-app.service
```
5. Если проблем с запуском службы не возникло, включим автозагрузку:
```bash
sudo systemctl enable net-app.service
```

Проверить работу приложения можно по url: [localhost:5000](http://localhost:5000).


## Аутентификация Kerberos
Теперь рассмотрим основную тему статьи, а именно реализуем механизм «аутентификации» в Kerberos для нашей службы.

### Предисловие
Рассмотрим мой пример:
> Разработано web-приложение на C#, кроссплатформенный фреймворк .NET 5.0, публиковано под платформу linux.
> Web-сервер Nginx с настроенными прокси (*:80->*:5000) и GSS аутентификацией (SPNEGO).
> Astra Linux сервер введен в домен Windows AD.
>
> Если запускать просто как приложение, то оно запускается и корректно взаимодействует с СУБД MSSQL от имени УЗ запускающего (в строке подключения к СУБД параметр Integrated Security=True). Но данный вариант не подходит т.к. по окончанию сеанса приложение останавливается.
>
> Если же мы запускаем приложение как сервис systemd, то возникают проблемы с аутентификацией. Ругается на Kerberos.
> 
> [Источник](https://ru.stackoverflow.com/questions/1595262/Ошибка-подключения-к-mssql-при-запуске-приложения-net5-как-сервиса-linux)

```bash
Ошибка получения данных Cannot authenticate using Kerberos.
Ensure Kerberos has been initialized on the client with 'kinit' and a Service Principal Name has been registered for the SQL Server to allow Kerberos authentication.
ErrorCode=InternalError, Exception=Interop+NetSecurityNative+GssApiException: GSSAPI operation failed with error - Unspecified GSS failure.
Minor code may provide more information (SPNEGO cannot find mechanisms to negotiate). at System.Net.Security.NegotiateStreamPal.GssInitSecurityContext(SafeGssContextHandle& context, SafeGssCredHandle credential, Boolean isNtlm, SafeGssNameHandle targetName, GssFlags inFlags, Byte[] buffer, Byte[]& outputBuffer, UInt32& outFlags, Int32& isNtlmUsed) at System.Net.Security.NegotiateStreamPal.EstablishSecurityContext(SafeFreeNegoCredentials credential, SafeDeleteContext& context, String targetName, ContextFlagsPal inFlags, SecurityBuffer inputBuffer, SecurityBuffer outputBuffer, ContextFlagsPal& outFlags) at Microsoft.Data.SqlClient.SNI.SNIProxy.GenSspiClientContext(SspiClientContextStatus sspiClientContextStatus, Byte[] receivedBuff, Byte[]& sendBuff, Byte[] serverName) at Microsoft.Data.SqlClient.SNI.TdsParserStateObjectManaged.GenerateSspiClientContext(Byte[] receivedBuff, UInt32 receivedLength, Byte[]& sendBuff, UInt32& sendLength, Byte[] _sniSpnBuffer) at Microsoft.Data.SqlClient.TdsParser.SNISSPIData(Byte[] receivedBuff, UInt32 receivedLength, Byte[]& sendBuff, UInt32& sendLength)
Ошибка получения данных в модуле авторизации Cannot authenticate using Kerberos.
Ensure Kerberos has been initialized on the client with 'kinit' and a Service Principal Name has been registered for the SQL Server to allow Kerberos authentication.
ErrorCode=InternalError, Exception=Interop+NetSecurityNative+GssApiException: GSSAPI operation failed with error - Unspecified GSS failure.
Minor code may provide more information (SPNEGO cannot find mechanisms to negotiate). at System.Net.Security.NegotiateStreamPal.GssInitSecurityContext(SafeGssContextHandle& context, SafeGssCredHandle credential, Boolean isNtlm, SafeGssNameHandle targetName, GssFlags inFlags, Byte[] buffer, Byte[]& outputBuffer, UInt32& outFlags, Int32& isNtlmUsed) at System.Net.Security.NegotiateStreamPal.EstablishSecurityContext(SafeFreeNegoCredentials credential, SafeDeleteContext& context, String targetName, ContextFlagsPal inFlags, SecurityBuffer inputBuffer, SecurityBuffer outputBuffer, ContextFlagsPal& outFlags) at Microsoft.Data.SqlClient.SNI.SNIProxy.GenSspiClientContext(SspiClientContextStatus sspiClientContextStatus, Byte[] receivedBuff, Byte[]& sendBuff, Byte[] serverName) at Microsoft.Data.SqlClient.SNI.TdsParserStateObjectManaged.GenerateSspiClientContext(Byte[] receivedBuff, UInt32 receivedLength, Byte[]& sendBuff, UInt32& sendLength, Byte[] _sniSpnBuffer) at Microsoft.Data.SqlClient.TdsParser.SNISSPIData(Byte[] receivedBuff, UInt32 receivedLength, Byte[]& sendBuff, UInt32& sendLength)
```

Выделим пункты для рассмотрения:
1. Из описания *проблемы* видим: при различных вариантах запуска приложения ошибка пропадает/появляется.
2. Из описания *ошибки* видим: `Kerberos has been initialized on the client with 'kinit' and a Service Principal Name has been registered for the SQL Server to allow Kerberos authentication.`

Кто знаком с Kerberos, уже догадался, в чем проблема, для тех, кто не сталкивался с Kerberos, есть хорошая статья с описанием принципа работы:
[Изучаем принцип работы Неimdal Kerberos](https://www.securitylab.ru/analytics/265153.php)

🙂 Кому лень читать, вот очень упрощённое описание работы протокола Kerberos:
1. Процесс аутентификации клиента Kerberos начинается, когда клиент запрашивает билет аутентификации или билет на выдачу билетов (TGT) с сервера аутентификации KDC. Поскольку этот первоначальный запрос не содержит конфиденциальной информации, он отправляется в виде простого текста.
2. KDC ищет клиента в своей базе данных. Если KDC находит клиента, он возвращает зашифрованный TGT и ключ сеанса. В противном случае процесс останавливается, и клиенту отказывается в доступе.
3. После аутентификации клиент использует TGT для запроса билета на доступ к службам у службы выдачи билетов (TGS).
4. Если TGS может аутентифицировать клиента, она отправляет клиенту учетные данные и билет для доступа к запрошенной службе. Этот билет хранится на устройстве конечного пользователя.
5. Клиент использует свой билет для запроса доступа к серверу приложений. Как только сервер приложений аутентифицирует запрос, клиент может получить доступ к серверу.

И вы можете подумать: «Ну всё, вопрос решён, расходимся», но нет. Выше я описал только часть проблемы, имеется ещё одна проблема, связанная с особенностями запуска приложения как службы, а именно **отдельные сессии**.

Службы, запускаемые через systemd, работают в изолированных сессиях. Переменные окружения, заданные в терминале пользователя, не передаются в эти сессии автоматически, а это значит, что необходимые переменные (они хранятся в env сессии) для запроса билетов аутентификации Kerberos отсутствуют.

:::TIP[Самореклама]
[Linux: Особенности запуска приложения как службы systemctl](/posts/linux-osobennosti-zapuska-prilozheniya-kak-sluzhby-systemctl/)
:::

Из вышеописанного следует, что необходимо реализовать следующее:
1. Создать keytab-файл с необходимыми SPN;
2. Добавление переменных окружения внутрь службы;
3. Запрос билетов Kerberos внутри запущенной службы.

### Создание keytab
О том как создавать keytab-файлы для Kerberos можно прочитать в статье - 
[Создаем keytab-файл для Kerberos аутентификации в Active Directory](https://winitpro.ru/index.php/2020/07/13/sozdat-keytab-fajl-spn-kerberos-autentifikacya-ad/).
Тут я приведу только пример команд для генерации keytab, которые я использовал для решения возникшей проблемы.

Чтобы создать keytab файл используется следующая команда:
```bash
ktpass -princ HTTP/www.test.com@TEST.COM -ptype KRB5_NT_PRINCIPAL -crypto ALL -mapuser [web] -pass "passwd" -out krb5_aspnet.keytab
ktpass -princ host/www.test.com@TEST.COM -ptype KRB5_NT_PRINCIPAL -crypto ALL -mapuser [web] -pass "passwd" -in krb5_aspnet.keytab  -out krb5_aspnet2.keytab
ktpass -princ MSSQLSvc/www.test.com@TEST.COM -ptype KRB5_NT_PRINCIPAL -crypto ALL -mapuser [web] -pass "passwd" -in krb5_aspnet2.keytab  -out krb5_aspnet3.keytab
```
- www.test.com - hostname сервера MSSQL;
- TEST.COM - домен AD;
- [web] - логин пользователя для которого создается keytab;
- passwd - пароль пользователя для которого создается keytab.

В результате выполнения команд получаем keytab-файл с именеим "krb5_aspnet3.keytab".

### Добавление переменных окружения в service
Для того, чтобы добавить переменные окружения внутрь `net-app.service` достаточно прописать `Environment` в секции `[Service]`.

1. Откроем файл `net-app.service` из каталога `/etc/systemd/system/`:
```bash
nano /etc/systemd/system/net-app.service
```

2. Добавим переменные:
```bash
...
[Service]
...
Environment=KRB5_KTNAME=/var/www/html/krb5_aspnet3.keytab
Environment=KRB5CCNAME=/tmp/krb5cc_NET

[Install]
...
```
> `KRB5_KTNAME` - указыват расположение файла keytab.

> `KRB5CCNAME` - переменная среды, которая должна указывать на расположение кэша учетных данных Kerberos 5 (ticket).

3. После внесения изменений необходимо обновить конфигурацию:
```bash
sudo systemctl daemon-reload
```

4. Перезапускаем службу:
```bash
sudo systemctl restart net-app.service
```

### Запрос билетов Kerberos
При обычной работе в системе Linux запрос билетов Kerberos выполняется командой `kinit`, но для запуска данной команды внутри службы systemd необходимо воспользоваться expect-скриптом, который необходимо запустить после или до запуска приложения.

:::TIP[Советую изучить]
[Bash-скрипты, часть 11: expect и автоматизация интерактивных утилит / Хабр](https://habr.com/ru/companies/ruvds/articles/328436/)
:::

Необходимо учитывать, что срок действия билетов Kerberos ограничен. Для решения этой проблемы мы создадим нечто вроде `cron`.

Создадим файл `kinit.exp` в каталоге приложения. 
```bash
nano /var/www/html/net-app/kinit.exp
```
Пропишем следующий алгоритм:
```bash
#!/usr/bin/expect

spawn kinit user_name
expect "Password for\r"
send -- "**{pass}**"
expect eof
```

- `spawn kinit user_name` - данная команда запускает `kinit` с указанием для какого пользователя выдаются билеты. Вместо `user_name` укажите логин того пользователя который имеет необходимые права.
- `expect "Password for\r"` - команда ожидает ответа в котором содержится подстрока `Password for\r`.
- `send -- "_pass_"` - отправляем ответ на запрос пароля. Вместо `_pass_` укажите соответствующий пароль пользователя.
- `expect eof` - окончание файла.

Теперь нужно настроить периодический запуск этого скрипта. В моём случае билеты Kerberos действительны в течение примерно пяти часов. Это означает, что до истечения этого времени нужно получить новые билеты. В bash-скриптах для этого есть специальная команда — `sleep`.

Создадим два файла `kinit_loop.sh` и `rekinit.sh` в каталоге приложения. 
> kinit_loop.sh
```bash
#!/bin/sh

./kinit.exp &
exp_pid=$!
wait $exp_pid

./rekinit.sh &
```
> rekinit.sh
```bash
#!/bin/sh

sleep 18000 &
sleep_pid=$!
wait $sleep_pid

./kinit_loop.sh
```

Логика работы скриптов:
- `kinit_loop.sh` - запускает скрипт `kinit.exp` в фоновом режиме, получает PID процесса и ожидает его завершения, по завершении процесса запускает скрипт `rekinit.sh`;
- `rekinit.sh` - запускает ожидание на 18000 секунд (5ч) в фоновом режиме, получает PID процесса и ожидает его завершения, по завершении процесса запускает скрипт `kinit_loop.sh`.

Тем самым мы получаем подобие `cron` который запускает скрипты про расписанию (каждые n сек.).

Осталось добавить вызов скрипта `kinit_loop.sh` в наш `net-app.service`, воспользуемся `ExecStartPost` в секции `[Service]`.
```bash
...
[Service]
...
ExecStart=/usr/bin/dotnet /var/www/html/net-app/NET.WP.dll
ExecStartPost=/bin/bash /var/www/html/net-app/kinit_loop.sh # <--- +
Restart=always
...
[Install]
...
```
После внесения изменений необходимо обновить конфигурацию:
```bash
sudo systemctl daemon-reload
```
Перезапускаем службу:
```bash
sudo systemctl restart net-app.service
```

## Заключение
Запуск приложений как службы в Linux сильно разнится от Windows: использование init.d, systemd или upstart, файлы конфигурации, запуск как демона и т.д., усложняет использование Linux как сервер для ASP.NET-приложений. Надеюсь, данная информация поможет вам продвинуться в понимании особенностей работы системы Linux.

Данный вариант решения сложившейся [проблемы](https://ru.stackoverflow.com/questions/1595262/Ошибка-подключения-к-mssql-при-запуске-приложения-net5-как-сервиса-linux) - неидеален, если есть иной вариант, более простой, можете поделиться им в комментариях.

## Полезные ссылки по теме
- [Управление службами Linux - Losst](https://losst.pro/upravlenie-sluzhbami-linux)
- [Astra Linux: Установка MS .Net Core и MS Visual Studio Code](https://wiki.astralinux.ru/pages/viewpage.action?pageId=41192241)
- [Создание и настройка приложений ASP.NET Core в Linux - ASP.NET Core | Microsoft Learn](https://learn.microsoft.com/ru-ru/troubleshoot/developer/webapps/aspnetcore/practice-troubleshoot-linux/2-1-create-configure-aspnet-core-applications)
- [Web server implementations in ASP.NET Core | Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/?view=aspnetcore-9.0&tabs=linux#kestrel)
- [Linux: Особенности запуска приложения как службы systemctl](/posts/linux-osobennosti-zapuska-prilozheniya-kak-sluzhby-systemctl/)
- [Kerberos - Справочный центр - Справочный центр Astra Linux](https://wiki.astralinux.ru/display/doc/Kerberos)
- [Изучаем принцип работы Неimdal Kerberos](https://www.securitylab.ru/analytics/265153.php)
- [Создаем keytab-файл для Kerberos аутентификации в Active Directory](https://winitpro.ru/index.php/2020/07/13/sozdat-keytab-fajl-spn-kerberos-autentifikacya-ad/)
- [Bash-скрипты, часть 11: expect и автоматизация интерактивных утилит / Хабр](https://habr.com/ru/companies/ruvds/articles/328436/)

